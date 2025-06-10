import os
import json
import asyncio
import logging
from dotenv import load_dotenv
from web_scraper import WebScraper

from autogen_agentchat.teams import Swarm
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import AzureOpenAIChatCompletionClient
from autogen_agentchat.conditions import HandoffTermination, TextMentionTermination
from autogen_agentchat.messages import HandoffMessage, TextMessage

# -----------------------------------------------------------------------------
# Logging configuration: Write logs to a file instead of terminal.
# -----------------------------------------------------------------------------
LOG_FILENAME = "agent_workflow.log"
logging.basicConfig(
    filename=LOG_FILENAME,
    filemode='a',
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(override=True)


class AITeacher:
    """
    Manages a team of teaching agents using the Autogen Swarm Team.
    The workflow for a user wanting to learn a topic is as follows:

      1. **Master Agent:**  
         - Greets the user and explains that they should provide a URL of content they wish to learn.
         - Waits for the user to provide the URL.
         - Hands off the URL to the Web Scraping Agent.

      2. **Web Scraping Agent:**  
         - Accepts the URL, scrapes the raw content from it (without adding commentary).
         - Hands off the raw scraped content to the Data Cleaning Agent.

      3. **Data Cleaning Agent:**  
         - Receives the raw content.
         - Filters out unnecessary details such as ads, extra links, button texts, etc.
         - Hands off the cleaned content to the Course Outline Agent.

      4. **Course Outline Agent:**  
         - Uses the cleaned content to generate a comprehensive course outline (with chapters and subchapters).
         - Hands off the outline to the Topic Explainer Agent.

      5. **Topic Explainer Agent:**  
         - Explains each topic/chapter to the user in a clear, step-by-step manner.
         - Awaits user questions and, upon confirmation of understanding, hands off to the Quiz Agent.

      6. **Quiz Agent:**  
         - Generates quiz questions (e.g., multiple-choice) based on the explained topics.
         - Hands off to the user for answers, then upon completion, returns to the Topic Explainer Agent for further explanations.
    
    Termination occurs when a handoff to the user is explicitly signaled or when the text "TERMINATE" is mentioned.
    """

    def __init__(self):
        # Initialize the Azure OpenAI client
        self.azure_openai_client = AzureOpenAIChatCompletionClient(
            azure_deployment=os.getenv("AZURE_DEPLOYMENT"),
            model=os.getenv("MODEL"),
            api_version=os.getenv("API_VERSION"),
            azure_endpoint=os.getenv("AZURE_ENDPOINT"),
            api_key=os.getenv("API_KEY"),
        )
        # Set up the agents team
        self.team = self._get_teaching_agents_team()
        self.last_message = None

    def setup_master_agent(self) -> AssistantAgent:
        """
        Sets up the master (teacher) agent.
        - Greets and guides the user.
        - Requests a URL from the user to fetch learning content.
        - Handoffs to the 'web_scraping_agent' once a URL is provided.
        """
        MASTER_AGENT_PROMPT = """
You are a master teacher agent responsible for initiating the learning session.
Greet the user warmly and explain that you can help them learn a new skill or topic.
Ask the user to provide a URL that links to content they wish to learn from, then Handoff to user.
If the user provides a URL, immediately handoff to 'web_scraping_agent' for further processing.
If the user asks a question or deviates from the URL input, politely steer them back to providing the URL and handoff to user.
        """

        master_agent = AssistantAgent(
            name="master_agent",
            handoffs=["web_scraping_agent", "user"],
            model_client=self.azure_openai_client,
            system_message=MASTER_AGENT_PROMPT.strip(),
        )
        logger.info("Master agent set up successfully.")
        return master_agent
    
    def scrape_content_from_url(self, url: str) -> str:
        """
        Placeholder function to scrape content from a given URL.
        This function can be replaced with a more sophisticated web scraping implementation.
        """
        print('URL:', url)
        scraper = WebScraper()
        scraped_content = scraper.scrape_text(url)
        # try:
        #     scraped_content = scraper.scrape_text(url)
        # except Exception as e:
        #     scraped_content = f"Error: {str(e)}"
        #     logger.error("Error while scraping content from URL: %s", e)
        return scraped_content
    
    def setup_web_scraping_agent(self) -> AssistantAgent:
        """
        Sets up the web scraping agent.
        - Accepts the URL provided by the master agent.
        - Scrapes the raw textual content from the URL (without adding any commentary).
        - Handoffs the raw scraped content to the 'data_cleaning_agent'.
        """
        WEB_SCRAPING_AGENT_PROMPT = """
You are a web scraping agent.
Your task is to extract the main textual content from the URL provided by the user.
Do not provide any analysis or commentary. Simply fetch the raw text as accurately as possible.
Provide the scraped raw content, then handoff to 'data_cleaning_agent'.
If the URL is invalid or the content cannot be scraped, communicate the error clearly and send TERMINATE to end the session.
        """

        web_scraping_agent = AssistantAgent(
            name="web_scraping_agent",
            handoffs=["data_cleaning_agent"],
            model_client=self.azure_openai_client,
            tools=[self.scrape_content_from_url],
            system_message=WEB_SCRAPING_AGENT_PROMPT.strip(),
        )
        logger.info("Web scraping agent set up successfully.")
        return web_scraping_agent

    def setup_data_cleaning_agent(self) -> AssistantAgent:
        """
        Sets up the data cleaning agent.
        - Receives the raw content from the web scraping agent.
        - Cleans the content by filtering out unnecessary details such as ads, extraneous links, button texts, etc.
        - Ensures the text is focused on educational content.
        - Handoffs the cleaned content to the 'course_outline_agent'.
        """
        DATA_CLEANING_AGENT_PROMPT = """
You are a data cleaning agent.
Your responsibility is to process the raw content received from the web scraping agent.
Remove unnecessary details including ads, irrelevant links, button texts, and other non-educational content.
Ensure the remaining text is concise, clear, and focused on providing educational value.
After cleaning the data, handoff to the 'course_outline_agent'.
        """

        data_cleaning_agent = AssistantAgent(
            name="data_cleaning_agent",
            handoffs=["course_outline_agent"],
            model_client=self.azure_openai_client,
            system_message=DATA_CLEANING_AGENT_PROMPT.strip(),
        )
        logger.info("Data cleaning agent set up successfully.")
        return data_cleaning_agent

    def setup_course_outline_agent(self) -> AssistantAgent:
        """
        Sets up the course outline agent.
        - Receives cleaned content from the data cleaning agent.
        - Generates a well-organized course outline with chapters and subchapters.
        - The outline should logically structure the content for a clear learning progression.
        - Handoffs the outline to the 'topic_explainer' agent.
        """
        COURSE_OUTLINE_AGENT_PROMPT = """
You are a Course Outline Agent with extensive experience in instructional design. Your primary task is to develop a comprehensive and logically structured course outline based on the cleaned content provided by the Data Cleaning Agent. Ensure that the outline aligns with the user's learning objectives and incorporates their feedback.

Responsibilities:
- Create clear chapters and subchapters to guide the learning process.
- Present the course outline to the user whenever it is created or updated, and request their feedback.

Handoff Protocol:
- After presenting the created or updated course outline, ask the user if they require any changes, then handoff to user.
- If the user is satisfied with the course outline, handoff to the 'Topic Explainer' agent.

Always handoff to single agent at a time. Always respond first before handing off to user or any other agent.
    """

        course_outline_agent = AssistantAgent(
            name="course_outline_agent",
            handoffs=["topic_explainer", "user"],
            model_client=self.azure_openai_client,
            system_message=COURSE_OUTLINE_AGENT_PROMPT.strip(),
        )
        logger.info("Course outline agent set up successfully.")
        return course_outline_agent

    def setup_topic_explainer_agent(self) -> AssistantAgent:
        """
        Sets up the topic explainer agent.
        - Receives the course outline from the course outline agent.
        - Explains each chapter or subchapter in simple, understandable language.
        - Invites user questions and ensures the user comprehends the material.
        - Upon confirmation of understanding or when the user has no further questions, handoff to the 'quiz_agent'.
        """
        TOPIC_EXPLAINER_AGENT_PROMPT = """
You are a Topic Explainer Agent with a talent for simplifying complex ideas. Your primary task is to explain each part of the course outline provided by the Course Outline Agent in a clear, structured, and engaging manner.

Responsibilities:
- Break down each topic into step-by-step explanations.
- Provide relevant examples to enhance understanding.
- After each explanation, check with the user for any questions or clarifications before proceeding.
- Ensure that explanations are adapted based on user feedback to optimize learning.
- Ensure user always completes quiz before proceeding to next chapter.

Handoff Protocol:
- After explaining a topic, confirm with the user if they have any questions or need further clarification, then handoff to user.
- If the user confirms understanding of chapter or is ready to proceed for next chapter, always handoff to the 'Quiz Agent' before moving to next chapter.

Always handoff to single agent at a time. Always respond first before handing off to user or any other agent.
"""

        topic_explainer_agent = AssistantAgent(
            name="topic_explainer",
            handoffs=["user", "quiz_agent"],
            model_client=self.azure_openai_client,
            system_message=TOPIC_EXPLAINER_AGENT_PROMPT.strip(),
        )
        logger.info("Topic explainer agent set up successfully.")
        return topic_explainer_agent

    def setup_quiz_agent(self) -> AssistantAgent:
        """
        Sets up the quiz agent.
        - Generates a quiz with multiple-choice questions based on the explained topics.
        - Invites the user to answer the quiz.
        - If the user completes the quiz, handoff back to the 'topic_explainer' agent for further explanations.
        - If the user requires further attempts, remain in interaction with the user.
        """

        QUIZ_AGENT_PROMPT = """
You are a Quiz Agent responsible for reinforcing learning through interactive assessments. Your sole task is to generate multiple-choice quizzes based on the last chapter covered by the Topic Explainer Agent and provide feedback on user responses.

Responsibilities:
- Generate well-structured multiple-choice questions that test the user's understanding of the explained topics.
- Provide feedback on incorrect answers and offer brief explanations to reinforce learning.
- If the user struggles, adapt the quiz or explanations to help clarify misunderstandings before moving forward.

Handoff Protocol:
- After presenting the quiz, handoff to user and wait for their responses.
- If the user answers all questions correctly, send feedback and handoff to the 'Topic Explainer Agent' to proceed with the next topic.
- If the user has not attempted all questions ask user to attempt all questions, then handoff to user.

Instructions:
- Always handoff to single agent at a time. 
- Always provide your feedback before handing off to user or any other agent.
"""


        quiz_agent = AssistantAgent(
            name="quiz_agent",
            handoffs=["user", "topic_explainer"],
            model_client=self.azure_openai_client,
            system_message=QUIZ_AGENT_PROMPT.strip(),
        )
        logger.info("Quiz agent set up successfully.")
        return quiz_agent

    def _get_teaching_agents_team(self) -> Swarm:
        """
        Constructs the Swarm team with all teaching agents in the proper workflow order:
          1. master_agent
          2. web_scraping_agent
          3. data_cleaning_agent
          4. course_outline_agent
          5. topic_explainer
          6. quiz_agent

        The termination condition is defined as:
          - Terminate when a handoff to 'user' is received.
          - Also, terminate if the text "TERMINATE" is mentioned.
        """
        master_agent = self.setup_master_agent()
        web_scraping_agent = self.setup_web_scraping_agent()
        data_cleaning_agent = self.setup_data_cleaning_agent()
        course_outline_agent = self.setup_course_outline_agent()
        topic_explainer_agent = self.setup_topic_explainer_agent()
        quiz_agent = self.setup_quiz_agent()

        termination = HandoffTermination(target="user") | TextMentionTermination("TERMINATE")
        team = Swarm(
            [
                master_agent,
                web_scraping_agent,
                data_cleaning_agent,
                course_outline_agent,
                topic_explainer_agent,
                quiz_agent
            ],
            termination_condition=termination,
        )
        logger.info("Teaching agents team (Swarm) created successfully with all agents.")
        return team
    
    def get_team_id(self) -> str:
        return self.team._team_id
    
    async def start_conversation(self, user_message: str) -> list:
        """
        Starts the conversation by sending an initial user message to the team.
        Returns a list of tuples (source, content) representing the conversation.
        """
        logger.info("Starting conversation with user message: %s", user_message)
        messages = self.team.run_stream(task=user_message)
        conversation = []

        try:
            async for message in messages:
                if isinstance(message, TextMessage):
                    logger.info("Received TextMessage from %s", message.source)
                    conversation.append((message.source, message.content))
                elif isinstance(message, HandoffMessage):
                    logger.info("Received HandoffMessage from %s", message.source)
                    if message.source != "user":
                        self.last_message = message
        except Exception as e:
            logger.exception("Error during start_conversation: %s", e)
            raise e
        
        team_state = await self.team.save_state()
        # conversation_id = self.get_team_id()
        # conversation_title = user_message

        # Load existing conversations from the JSON file
        conversations_file = "conversations.json"
        if os.path.exists(conversations_file):
            with open(conversations_file, "r") as file:
                conversations = json.load(file)
        else:
            conversations = []

        # Check if the conversation_id already exists
        conversation_id = self.get_team_id()
        conversation_title = user_message
        existing_conversation = next((conv for conv in conversations if conv["conversation_id"] == conversation_id), None)

        if existing_conversation:
            # Update the existing conversation
            existing_conversation["state"] = team_state
            existing_conversation["conversation_title"] = conversation_title
        else:
            # Create a new conversation entry
            new_conversation = {
            "conversation_id": conversation_id,
            "conversation_title": conversation_title,
            "state": team_state,
            }
            conversations.append(new_conversation)

        # Save the updated conversations back to the JSON file
        with open(conversations_file, "w") as file:
            json.dump(conversations, file, indent=4)

        return conversation[1:]

    async def send_message(self, user_message: str, last_message_source: str) -> list:
        """
        Continues the conversation by sending a message directed to the last handoff agent.
        Returns the updated conversation as a list of tuples (source, content).
        """
        # if not self.last_message:
        #     logger.error("No previous handoff found. Please start a conversation first.")
        #     raise ValueError("No handoff message available. Start a conversation first.")

        if not last_message_source:
            last_message_source = self.last_message.source
        try:
            task_message = HandoffMessage(
                source="user",
                target=last_message_source,
                content=user_message,
            )
        except Exception as e:
            logger.exception("Error during send_message: %s", e)
            raise e
        
        logger.info("Sending message to %s: %s", last_message_source, user_message)
        messages = self.team.run_stream(task=task_message)
        conversation = []

        try:
            async for message in messages:
                if isinstance(message, TextMessage):
                    logger.info("Received TextMessage from %s", message.source)
                    conversation.append((message.source, message.content))
                elif isinstance(message, HandoffMessage):
                    logger.info("Received HandoffMessage from %s", message.source)
                    if message.source != "user":
                        self.last_message = message
        except Exception as e:
            logger.exception("Error during send_message: %s", e)
            raise e
        
        team_state = await self.team.save_state()
        # conversation_id = self.get_team_id()
        # conversation_title = user_message

        # Load existing conversations from the JSON file
        conversations_file = "conversations.json"
        if os.path.exists(conversations_file):
            with open(conversations_file, "r") as file:
                conversations = json.load(file)
        else:
            conversations = []

        # Check if the conversation_id already exists
        conversation_id = self.get_team_id()
        conversation_title = user_message
        existing_conversation = next((conv for conv in conversations if conv["conversation_id"] == conversation_id), None)

        if existing_conversation:
            # Update the existing conversation
            existing_conversation["state"] = team_state
            existing_conversation["conversation_title"] = conversation_title
        else:
            # Create a new conversation entry
            new_conversation = {
            "conversation_id": conversation_id,
            "conversation_title": conversation_title,
            "state": team_state,
            }
            conversations.append(new_conversation)

        # Save the updated conversations back to the JSON file
        with open(conversations_file, "w") as file:
            json.dump(conversations, file, indent=4)
        return conversation