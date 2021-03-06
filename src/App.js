import React, { Component , useState} from 'react';
import logo from './logo.svg';
import './App.css';
import polly from 'aws-polly'
import { Logger } from 'aws-amplify';
import Predictions, { AmazonAIPredictionsProvider } from '@aws-amplify/predictions';

import Amplify, { Analytics, Storage, API, graphqlOperation, XR} from 'aws-amplify';
import awsconfig from './aws-exports';
import  { Authenticator, withAuthenticator }  from 'aws-amplify-react';
import scene1Config from './sumerian_exports_af2304edc8334160b5432b0ac5076b10.json'; 

Amplify.addPluggable(new AmazonAIPredictionsProvider());
Amplify.configure(awsconfig);
const logger = new Logger('foo');

XR.configure({
  SumerianProvider: {
    region: 'us-east-1', 
    scenes: {
      "MlaaiIntro": { 
        sceneConfig: scene1Config, 
		publishParamOverrides: { alpha: true }
      }
    },
  }
});

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

function IndeterminateLoading() {
    return <img src={logo} className="App-logo" alt="logo"/>;
}

function TextTranslation() {
  const [response, setResponse] = useState("Input text to translate")
  const [textToTranslate, setTextToTranslate] = useState("write to translate");

  function translate() {
    Predictions.convert({
      translateText: {
        source: {
          text: textToTranslate,
          language : "en" // defaults configured in aws-exports.js
        },
        targetLanguage: "es"
      }
    }).then(result => setResponse(JSON.stringify(result, null, 2)))
      .catch(err => setResponse(JSON.stringify(err, null, 2)))
  }

  function setText(event) {
    setTextToTranslate(event.target.value);
  }

  return (
    <div className="Text">
      <div>
        <h3>Text Translation</h3>
        <input value={textToTranslate} onChange={setText}></input>
        <button onClick={translate}>Translate</button>
        <p>{response}</p>
      </div>
    </div>
  );
}
 
function TextToSpeech() {
  const [response, setResponse] = useState("...")
  const [textToGenerateSpeech, setTextToGenerateSpeech] = useState("write to speech");
  const [audioStream, setAudioStream] = useState();
  function generateTextToSpeech() {
    setResponse('Generating audio...');
    Predictions.convert({
      textToSpeech: {
        source: {
          text: textToGenerateSpeech,
          language: "es-MX" // default configured in aws-exports.js 
        },
        voiceId: "Mia"
      }
    }).then(result => {
      
      setAudioStream(result.speech.url);
      setResponse(`Generation completed, press play`);
    })
      .catch(err => setResponse(JSON.stringify(err, null, 2)))
  }

  function setText(event) {
    setTextToGenerateSpeech(event.target.value);
  }

  function play() {
    var audio = new Audio();
    audio.src = audioStream;
    audio.play();
  }
  return (
    <div className="Text">
      <div>
        <h3>Text To Speech</h3>
        <input value={textToGenerateSpeech} onChange={setText}></input>
        <button onClick={generateTextToSpeech}>Text to Speech</button>
        <h3>{response}</h3>
        <button onClick={play}>play</button>
      </div>
    </div>
  );
}


class SumerianScene extends Component {

    async componentDidMount() {
        await this.loadAndStartScene();
    }

    render() {
        return <div
            id="sumerian-scene-dom-id"
            style={{width: "100%", height: "100%", position: "absolute"}}
        />;
    }

    async loadAndStartScene() {
		
		await XR.loadScene(this.props.scene, "sumerian-scene-dom-id" );

		if (XR.isSceneLoaded(this.props.scene)) {
			
			if (XR.isMuted(this.props.scene)) {
				// The scene is muted
			
				XR.setMuted(this.props.scene, false) // Unmute
			}

		}
		XR.enableAudio(this.props.scene)
		
        const controller = XR.getSceneController(this.props.scene);
        this.props.onLoaded(controller);
		
		if (XR.isSceneLoaded(this.props.scene)) {
			if (XR.isVRCapable(this.props.scene)) {
				XR.enterVR(this.props.scene)
			}
		}
		
		try {

			XR.start(this.props.scene);
		} catch(e) {
			logger.error('error happened', e);
		}

    }

}

class App extends Component {
	  
		uploadFile = (evt) => {
		const file = evt.target.files[0];
		const name = file.name;

		Storage.put(name, file).then(() => {
		  this.setState({ file: name });
		})
	  }

	  async componentDidMount() {
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
		  const response = await API.get('mlaaiapp', '/items/object/1');
		  alert(JSON.stringify(response, null, 2));
		};
		list = async () => {
		  console.log('calling api');
		  const response = await API.get('mlaaiapp', '/items/1');
		  alert(JSON.stringify(response, null, 2));
		};

	constructor(props) {
			super(props);
			this.state = {
				loading: true,
				sceneController: null
			};
    }

    sceneLoaded(sceneController) {
        this.setState({
            loading: false,
            sceneController
        });
    }

    render() {
        return (
            <div className="App">
				<Authenticator usernameAttributes='email'/>
							
                {this.state.loading && <IndeterminateLoading/>}
                <div style={{visibility: this.state.loading && 'hidden'}}>
                    <SumerianScene scene='MlaaiIntro' onLoaded={(controller) => this.sceneLoaded(controller)}/>
                </div>
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

