import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Amplify, { Analytics, Storage, API, graphqlOperation } from 'aws-amplify';
import awsconfig from './aws-exports';
import { Authenticator, withAuthenticator, S3Album } from 'aws-amplify-react';

Amplify.configure(awsconfig);
Storage.configure({ level: 'private' });

const listTodos = `query listTodos {
  listTodos{
    items{
      id
      name
      description
    }
  }
}`;

const addTodo = `mutation createTodo($name:String! $description: String!) {
  createTodo(input:{
    name:$name
    description:$description
  }){
    id
    name
    description
  }
}`;

class App extends Component {
	  uploadFile = (evt) => {
		const file = evt.target.files[0];
		const name = file.name;

		Storage.put(name, file).then(() => {
		  this.setState({ file: name });
		})
	  }

	  componentDidMount() {
		Analytics.record('Amplify_CLI');
	  }
	  
	  todoMutation = async () => {
		  const todoDetails = {
			name: 'Party tonight!',
			description: 'Amplify CLI rocks!'
		  };

		  const newTodo = await API.graphql(graphqlOperation(addTodo, todoDetails));
		  alert(JSON.stringify(newTodo));
		};

		listQuery = async () => {
		  console.log('listing todos');
		  const allTodos = await API.graphql(graphqlOperation(listTodos));
		  alert(JSON.stringify(allTodos));
		};

		post = async () => {
		  console.log('calling api');
		  const response = await API.post('mlaaiapp', '/items', {
			body: {
			  id: '1',
			  name: 'hello amplify!'
			}
		  });
		  alert(JSON.stringify(response, null, 2));
		};
		get = async () => {
		  console.log('calling api');
		  const response = await API.get('myapi', '/items/object/1');
		  alert(JSON.stringify(response, null, 2));
		};
		list = async () => {
		  console.log('calling api');
		  const response = await API.get('myapi', '/items/1');
		  alert(JSON.stringify(response, null, 2));
		};
	render() {
    return (
	  <div className="App">
		<Authenticator usernameAttributes='email'/>
        <p> Pick a file</p>
        <input type="file" onChange={this.uploadFile} />
        <button onClick={this.listQuery}>GraphQL Query</button>
        <button onClick={this.todoMutation}>GraphQL Mutation</button>
		
		<button onClick={this.post}>POST</button>
        <button onClick={this.get}>GET</button>
        <button onClick={this.list}>LIST</button>


        <S3Album level="private" path='' />
      </div>
    );
  }
}

const signUpConfig = {
  header: 'Mlaai Sign Up',
  hideAllDefaults: true,
  defaultCountryCode: '1',
  signUpFields: [
    {
      label: 'User Name',
      key: 'username',
      required: true,
      displayOrder: 1,
      type: 'string'
    },
    {
      label: 'Password',
      key: 'password',
      required: true,
      displayOrder: 2,
      type: 'password'
    },
    {
      label: 'Email',
      key: 'email',
      required: true,
      displayOrder: 3,
      type: 'string'
    }
  ]
};
const usernameAttributes = 'User Name';


export default withAuthenticator(App, {
  signUpConfig,
  usernameAttributes
});
