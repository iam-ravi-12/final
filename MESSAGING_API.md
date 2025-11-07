# Messaging System API Documentation

This document describes the REST API endpoints for the messaging system.

## Authentication

All messaging endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Send Message

Send a message to another user.

**Endpoint:** `POST /api/messages`

**Request Body:**
```json
{
  "receiverId": 2,
  "content": "Hello! How are you?"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "senderId": 1,
  "senderUsername": "john_doe",
  "receiverId": 2,
  "receiverUsername": "jane_smith",
  "content": "Hello! How are you?",
  "isRead": false,
  "createdAt": "2025-11-07T15:30:00"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Receiver user not found

---

### 2. Get Conversations

Get all conversations for the authenticated user.

**Endpoint:** `GET /api/messages/conversations`

**Response:** `200 OK`
```json
[
  {
    "userId": 2,
    "username": "jane_smith",
    "profession": "Software Engineer",
    "lastMessage": "See you tomorrow!",
    "lastMessageTime": "2025-11-07T15:30:00",
    "unreadCount": 3
  },
  {
    "userId": 3,
    "username": "bob_wilson",
    "profession": "Data Scientist",
    "lastMessage": "Thanks for the help!",
    "lastMessageTime": "2025-11-07T14:15:00",
    "unreadCount": 0
  }
]
```

**Notes:**
- Conversations are sorted by most recent message first
- `unreadCount` shows number of unread messages from that user

---

### 3. Get Messages with User

Get all messages between the authenticated user and another user.

**Endpoint:** `GET /api/messages/with/{userId}`

**Path Parameters:**
- `userId` (Long) - ID of the other user

**Example:** `GET /api/messages/with/2`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "senderId": 1,
    "senderUsername": "john_doe",
    "receiverId": 2,
    "receiverUsername": "jane_smith",
    "content": "Hello! How are you?",
    "isRead": true,
    "createdAt": "2025-11-07T15:30:00"
  },
  {
    "id": 2,
    "senderId": 2,
    "senderUsername": "jane_smith",
    "receiverId": 1,
    "receiverUsername": "john_doe",
    "content": "I'm doing great, thanks!",
    "isRead": true,
    "createdAt": "2025-11-07T15:31:00"
  }
]
```

**Notes:**
- Messages are ordered chronologically (oldest first)
- Includes both sent and received messages

---

### 4. Mark Messages as Read

Mark all messages from a specific user as read.

**Endpoint:** `PUT /api/messages/read/{userId}`

**Path Parameters:**
- `userId` (Long) - ID of the sender whose messages should be marked as read

**Example:** `PUT /api/messages/read/2`

**Response:** `200 OK` (no body)

**Notes:**
- Only marks messages where the authenticated user is the receiver
- Automatically called when viewing a conversation in the UI

---

## Usage Examples

### Starting a Conversation

1. User clicks on another user's profile picture in a post
2. Frontend navigates to `/messages` with the user's ID
3. If no previous messages exist, the conversation list will be empty
4. User types and sends the first message using `POST /api/messages`
5. The conversation now appears in both users' conversation lists

### Viewing Conversations

1. User clicks the "Messages" button in the navbar
2. Frontend calls `GET /api/messages/conversations` to load all conversations
3. Each conversation shows:
   - The other user's username and profession
   - A preview of the last message
   - The number of unread messages (if any)
4. Conversations are sorted with the most recent at the top

### Chatting with a User

1. User selects a conversation from the list
2. Frontend calls `GET /api/messages/with/{userId}` to load message history
3. Frontend automatically calls `PUT /api/messages/read/{userId}` to mark messages as read
4. Messages are displayed in chronological order
5. User can send new messages using `POST /api/messages`
6. Frontend polls `GET /api/messages/with/{userId}` every 3 seconds for new messages

### Real-time Updates

The current implementation uses polling for real-time updates:
- **Active conversation**: Polls every 3 seconds for new messages
- **Conversation list**: Polls every 5 seconds for updates
- Messages are automatically marked as read when viewing a conversation

## Database Schema

The messaging system uses a `messages` table with the following structure:

```sql
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_receiver_unread (receiver_id, is_read)
);
```

**Note:** This schema is automatically created by JPA/Hibernate on application startup.

## Integration with Posts

The messaging system integrates with the existing post system:

1. All posts now include a `userId` field in the response
2. Profile pictures on posts are clickable
3. Clicking a profile picture navigates to the messages page with that user pre-selected
4. Users cannot message themselves (clicking own profile picture does nothing)

## Future Enhancements

Potential improvements for the messaging system:

1. **WebSocket Support**: Replace polling with WebSockets for true real-time messaging
2. **Read Receipts**: Show when messages were read
3. **Typing Indicators**: Show when the other user is typing
4. **Message Search**: Search through message history
5. **Message Deletion**: Allow users to delete messages
6. **File Attachments**: Support sending images and files
7. **Message Notifications**: Browser notifications for new messages
8. **Group Chats**: Support for conversations with multiple users
9. **Message Reactions**: Allow emoji reactions to messages
10. **Message Pagination**: Load message history in chunks for better performance
