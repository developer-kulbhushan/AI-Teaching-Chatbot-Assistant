export const MessageMarkdownComponents = {
    p: ({node, ...props}) => <p className="text-sm mb-2" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
    li: ({node, ...props}) => <li className="mb-1" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2" {...props} />,
    code: ({node, ...props}) => (
      <code className="bg-gray-800 text-white px-1 py-0.5 rounded text-xs" {...props} />
    ),
    pre: ({node, ...props}) => (
      <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2" {...props} />
    ),
  };