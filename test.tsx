const [newMessage, setNewMessage] = useState('');
    const [infoMsg, setInfoMsg] = useState(joinMsg);
    const [redirect, setRedirect] = useState(false);
    
    const newMsg = async (e: SyntheticEvent) =>
    {
        e.preventDefault();
        socket?.emit('msgToServer', { name: channelName, message: newMessage });
    }

    useEffect(() => {
        if (socket === null)
            setRedirect(true);
        setInfoMsg(joinMsg);
        return () => {
            // leave channel emit here
          }
    }, [joinMsg, socket]);

    if (redirect === true)
    {
        // leave channel emit here
        return <Navigate to={'/channels'} />;
    }

    return (
        <Wrapper>
            <div>{infoMsg}</div>
            <form onSubmit={newMsg}>
                <input placeholder="message" size={19} required onChange={e => setNewMessage(e.target.value)}/>
                <button type="submit">Send</button>
            </form>
            <div>
            {messages.map((message: MessageI) => {
                return (
                    <li key={message.id}>
                       {message.content}
                    </li>
                )
            })}
            </div>
            
        </Wrapper>
    );




    <Wrapper>
    <ChatContainer>
       <div>{infoMsg}</div>
  <h1>{newMessage}</h1>
  <form onSubmit={newMsg}>
      <input placeholder="message" size={19} required onChange={e => setNewMessage(e.target.value)}/>
      <button onClick={() => handle_send(newMessage)}>Click me</button>
  </form>
  <div>
  {messages.map((message: MessageI) => {
      return (
          <li key={message.id}>
              {/* {message.content} */}
          </li>
      )
  })}
  </div>
    </ChatContainer>
 

</Wrapper>