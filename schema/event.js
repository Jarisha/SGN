/* Event has no officially enforced schema, and thus we must be careful to do it correctly and consistently the first time.
* Every possible event must be documented here, and must conform to these examples.
* 
* Events YOU DO will show up in your TIMELINE, mostly
* Events done TO YOU will show up in notification, mostly
* 
* PRIVATE events, such as friend -> friend activity will not show up in Timeline
* 
* Event: { date: { year, month, day, hour, minute }, sourceUser, action, target, (targetLink), (content) }
*
* Assume YOU are user1@gmail.com, OTHER USER is user2@gmail.com
* 
* YOU Post Gamepin:
* {date, sourceUser: 'user1@gmail.com', action 'gamepinPosted', target: 'Action & Adventure', targetLink: '/post/763255732536733699'}
* 
* YOU Post Comment:
* {date, sourceUser: 'user1@gmail.com', action 'commentPosted', target: 'Sports', targetLink: '/post/763255732536733699'}
* 
* USER Comments on your Post:
* {date, sourceUser: 'user2@gmail.com', action 'commentRecieved', target: 'Sports', targetLink: '/post/763255732536733699'}
* 
* YOU Follow USER
* {date, sourceUser: 'user1@gmail.com', action 'followSent', target: 'user2@gmail.com' }
*
* USER Follows YOU:
* {date, sourceUser: 'user2@gmail.com', action 'followRecieved', target: 'user1@gmail.com' }
* 
* USER sends FriendRequest to YOU
* {date, sourceUser: 'user2@gmail.com', action 'requestRecieved', target: 'user1@gmail.com', content: '<p class="accept" >Accept</p>
*                                                                                                      <p class="Ingore" >Ignore</p>'} }
* YOU send FriendRequest to USER
* {date, sourceUser: 'user1@gmail.com', action 'requestSent', target: 'user3@gmail.com' }
*                                                                                                    
* USER accepts your request
* {date, sourceUser: 'user2@gmail.com', action 'requestAccepted', target: 'user1@gmail.com' }
*
* USER ignores your request - Nothing Happens
*
* An inital message sent will begin a conversation. A conversation will contain a list of message IDS. Messages can only be sent between friends.
*
* USER initiates YOU with conversation ->
*   Conversation started:
*     {date, sourceUser: 'user2@gmail.com', action: 'convoAccepted', target: 'user1@gmail.com', content: [firstId] }
*   Message sent:
*     {date, sourceUser: 'user2@gmail.com', action: 'messageAccepted', target: 'user1'}
*
* YOU initiate conversation with USER ->
*   Conversation started:
*     {date, sourceUser: 'user1@gmail.com', action: 'convo', target: 'user1@gmail.com', content: [firstId] }
*   Message sent:
*     {date, sourceUser: 'user1@gmail.com', action: 'messageAccepted', target: 'user1'}
*/