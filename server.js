const express=require('express')
const {SpeechClient}=require('@google-cloud/speech')
const textToSpeech=require('@google-cloud/text-to-speech')
const axios=require('axios')
const fs=require('fs')
const app=express()
app.use(express.json());
const speechClient = new SpeechClient();

const textToSpeechClient = new textToSpeech.TextToSpeechClient();
const OPENAI_API_KEY = '';

app.post('/voice',async(req,res)=>{
    try{
    const voiceData=req.body.voiceData
   const audio={
    content:voiceData,
   }
   const config={
    encoding:'LINEAR16',
    sampleRateHertz:16000,
    languageCode:'en-US',

   }
   const request={
    audio:audio,
    config:config,
   }
   const[response]=await speechClient.recognize(request);
   const transcript=response.results
   .map((result)=>result.alternatives[0].transcript)
   .join('');

   const gptResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt: transcript,
    max_tokens: 100,
  }, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
    
     const gptReply = gptResponse.data.choices[0].text.trim();
     const requestTTS = {
        input: { text: gptReply },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      };
  
      const [responseTTS] = await textToSpeechClient.synthesizeSpeech(requestTTS);
      const audioContent = responseTTS.audioContent;
      const audioPath='audio mp3'
      fs.whiteFileSync(audioPath, audioContent, 'binary');
  res.json({audioUrl:`https://example.com/${audioPath}`})
} catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to process voice input' });
  }
})
const port=3000
app.listen(port,()=>{
    console.log(`server is running on http://localhost${port}`);
})