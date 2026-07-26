export const formatTimestamp = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const exportChatAsMarkdown = (sessionTitle, messages) => {
  let content = `# ${sessionTitle || 'Chat Transcript'}\n\n`;
  content += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

  messages.forEach((msg) => {
    const sender = msg.sender === 'user' ? '👤 User' : '🤖 Gemini AI';
    content += `### ${sender}\n${msg.text}\n\n`;
  });

  downloadBlob(content, `${sanitizeFilename(sessionTitle)}.md`, 'text/markdown;charset=utf-8;');
};

export const exportChatAsTxt = (sessionTitle, messages) => {
  let content = `CHAT TRANSCRIPT: ${sessionTitle || 'Gemini AI Chat'}\n`;
  content += `Exported: ${new Date().toLocaleString()}\n\n========================================\n\n`;

  messages.forEach((msg) => {
    const sender = msg.sender === 'user' ? 'USER' : 'GEMINI AI';
    content += `[${sender}]:\n${msg.text}\n\n----------------------------------------\n\n`;
  });

  downloadBlob(content, `${sanitizeFilename(sessionTitle)}.txt`, 'text/plain;charset=utf-8;');
};

export const exportChatAsJson = (sessionTitle, messages) => {
  const exportObject = {
    title: sessionTitle || 'Gemini AI Chat',
    exported_at: new Date().toISOString(),
    message_count: messages.length,
    messages: messages.map((m) => ({
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
    })),
  };

  const content = JSON.stringify(exportObject, null, 2);
  downloadBlob(content, `${sanitizeFilename(sessionTitle)}.json`, 'application/json;charset=utf-8;');
};

const sanitizeFilename = (title) => {
  return (title || 'chat_transcript').replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

const downloadBlob = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
