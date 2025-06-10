from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai_teacher import AITeacher
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

managers = {}


class NewMessageRequest(BaseModel):
    message: str

class MessageRequest(BaseModel):
    message: str
    conversation_id: str

class ConversationRequest(BaseModel):
    conversation_id: str


@app.post("/start_conversation")
async def start_conversation(request: NewMessageRequest):
    try:
        agent_manager = AITeacher()
        managers[agent_manager.get_team_id()] = agent_manager
        response = await agent_manager.start_conversation(request.message)
        return {"conversation_id": agent_manager.get_team_id(), "conversation": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fetch_conversations")
async def fetch_conversations():
    try:
        with open('conversations.json', 'r') as file:
            conversations = json.load(file)

        conversation_list = [(conv['conversation_id'], conv['conversation_title']) for conv in conversations]
        return {
            "conversations":conversation_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/load_conversation")
async def load_conversation(request: ConversationRequest):
    try:
        with open('conversations.json', 'r') as file:
            conversations = json.load(file)

        conversation_state = None
        for conv in conversations:
            if conv['conversation_id'] == request.conversation_id:
                conversation_state = conv['state']
                break

        if conversation_state is None:
                raise HTTPException(status_code=404, detail="Chat history not found")
        
        
        message_thread = conversation_state.get("agent_states").get(f'group_chat_manager/{request.conversation_id}').get('message_thread')
        filtered_messages = list(filter(lambda msg: msg['type'] == 'TextMessage', message_thread))
        result = [(msg['source'], msg['content']) for msg in filtered_messages]
        return {
            "conversation": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_conversation")
async def delete_conversation(request: ConversationRequest):
    try:
        with open('conversations.json', 'r') as file:
            conversations = json.load(file)

        conversations = [conv for conv in conversations if conv['conversation_id'] != request.conversation_id]

        with open('conversations.json', 'w') as file:
            json.dump(conversations, file, indent=4)

        if request.conversation_id in managers:
            del managers[request.conversation_id]

        return {"detail": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send_message")
async def send_message(request: MessageRequest):
    last_message_source = None
    try:
        if request.conversation_id not in managers:
            agent_manager = AITeacher()

            with open('conversations.json', 'r') as file:
                conversations = json.load(file)

            conversation_state = None
            for conv in conversations:
                if conv['conversation_id'] == request.conversation_id:
                    conversation_state = conv['state']
                    break

            if conversation_state is None:
                raise HTTPException(status_code=404, detail="Chat history not found")
            
            message_thread = conversation_state.get("agent_states").get(f'group_chat_manager/{request.conversation_id}').get('message_thread')
            filtered_messages = list(filter(lambda msg: msg['type'] == 'HandoffMessage', message_thread))
            last_message_source = filtered_messages[-1]['source']
            await agent_manager.team.load_state(conversation_state)
            managers[request.conversation_id] = agent_manager
        
        print(last_message_source)
        response = await managers[request.conversation_id].send_message(request.message, last_message_source)
        return {"conversation": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
