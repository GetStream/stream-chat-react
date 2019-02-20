/* globals process */
import React, { Component } from 'react';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import ToggleButtonGroup from 'react-bootstrap/lib/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/lib/ToggleButton';
import Nav from 'react-bootstrap/lib/Nav';
import Navbar from 'react-bootstrap/lib/Navbar';
import Form from 'react-bootstrap/lib/Form';
import Button from 'react-bootstrap/lib/Button';
import './App.css';
import jwt from 'jsonwebtoken';
import { StreamChat } from 'stream-chat';

const localStorageKey = 'stream-chat-demo-v2';

const ApiSecret = process.env.REACT_APP_CHAT_SECRET;
const serverSideToken = jwt.sign({}, ApiSecret);
const chatClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
chatClient.userToken = serverSideToken;
chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);

class App extends Component {
  constructor(props) {
    super(props);

    let previousSession = localStorage.getItem(localStorageKey);
    previousSession =
      previousSession != null ? JSON.parse(previousSession) : {};

    this.state = {
      channelName: 'general',
      chatType: previousSession.chatType
        ? previousSession.chatType
        : 'messaging',
      username: previousSession.username ? previousSession.username : '',
      image: previousSession.image ? previousSession.image : '',
      token: previousSession.token ? previousSession.token : null,
      validated: false,
      isLoading: false,
    };
  }

  handleUsernameChange = (event) => {
    this.setState({ username: event.target.value });
  };

  handleImageChange = (event) => {
    this.setState({ image: event.target.value });
  };

  handleSubmit = async (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    console.log(this.state, process.env);

    if (form.checkValidity() === false) {
      return;
    }

    await this.setState({
      validated: true,
      isLoading: true,
    });

    const username = this.state.username;
    const channelName = this.state.channelName;

    const userData = {
      id: `${username}usenameinsteadplz`,
      name: username,
      image: this.state.image,
      role: 'admin',
    };
    const userClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
    userClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
    const token = jwt.sign({ user_id: userData.id }, ApiSecret);

    try {
      await chatClient.updateUser(userData);

      await userClient.setUser(userData, token);
      await userClient.channel(this.state.chatType, channelName, {}).watch();

      await this.setState({
        token,
      });

      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          username: this.state.username,
          channelName: this.state.channelName,
          image: this.state.image,
          token: this.state.token,
        }),
      );

      const url = `http://stream-chat-staging.s3-website-us-east-1.amazonaws.com/examples/${
        this.state.chatType
      }/build/index.html?user=${userData.id}&user_token=${
        this.state.token
      }&channel=general`;
      window.location.replace(url);
    } catch (e) {
      await this.setState({
        isLoading: false,
      });
    }
  };

  render() {
    const { validated, isLoading } = this.state;

    return (
      <div className="App">
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">Chat examples</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <ButtonToolbar>
                <ToggleButtonGroup
                  required
                  type="radio"
                  name="options"
                  defaultValue={[this.state.chatType]}
                  onChange={(val) => {
                    this.setState({ chatType: val });
                  }}
                >
                  <ToggleButton value={'messaging'}>Messaging</ToggleButton>
                  <ToggleButton value={'team'}>Team</ToggleButton>
                  <ToggleButton value={'livestream'}>Livestream</ToggleButton>
                </ToggleButtonGroup>
              </ButtonToolbar>
            </Nav>

            <Form inline validated={validated} onSubmit={this.handleSubmit}>
              <label>
                username:
                <input
                  type="text"
                  className="mr-sm-2"
                  value={this.state.username}
                  onChange={this.handleUsernameChange}
                />
              </label>
              <label>
                image url:
                <input
                  type="text"
                  className="mr-sm-2"
                  value={this.state.image}
                  onChange={this.handleImageChange}
                />
              </label>

              <p>&nbsp;&nbsp;</p>
              <Button
                variant="outline-success"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Loading…' : 'Save'}
              </Button>
            </Form>
          </Navbar.Collapse>
        </Navbar>
      </div>
    );
  }
}

export default App;
