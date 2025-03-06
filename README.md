# measure_visualizer

### simple measure visualizer
* requirements : nodejs

#### Listen for OSC messages on /measure address composed of 3 int values [bar,beat,fraction]

#### clone or download zip
```git clone https://github.com/Rhoumi/measure_visualizer/```

#### go to the directory
```cd measure_visualizer```

#### run
```
npm install
node server.js
```

#### tips

you can change your local port OSC listening and server running port in `server.js` file. By default : receiving on localhost:9123 sending on localhost:3000.
