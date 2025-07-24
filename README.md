# reactgwent
Hey, how's it going?
This is a react based implementation of Gwent from the Witcher 3, with online multiplayer. Or it will be soon. It's getting there.

There is version running live here if you're curious: https://reactgwent-front-end.onrender.com/loginregister .
Everything is on free hosting, so it might need time for a cold start. Press login, wait 30 seconds, then try again.

So far in the master branch you can create accounts, edit and save decks to the database, and play games with other players. All card abilities work except medic, all faction abilities work except Scoiatael, but none of the leader abilities work yet.

To run this locally, first download the repo, cd into the server folder and run npm install, and then cd to the client folder and run npm install again.
You also need to have mongodb running somewhere, and you need a config.env file in the server folder with a DB_URL variable pointing to it ("mongodb://127.0.0.1:27017" for local instance),
as well as a JWT_SECRET variable in the same file.
You also need a .env (no config) file in the client folder with a REACT_APP_BACKEND_URL pointing to the express server (usually "http://localhost:5000/").
If you want the images to work, you would also need REACT_APP_UNIT_IMAGE_BASE_URL and REACT_APP_LEADER_IMAGE_BASE_URL variables pointing to where you're hosting your images.

Once you do all that, you need to run two processes. From the server folder run "node server.mjs" and from the client folder run "npm start".
This will start the express back end and the react front end respectively.
Also, this is my first react project, and I suck at styling, so sorry about that.

Finally, licenses. You are not allowed to publish this anywhere. CDPR gave me permission to build this for demo purposes only.

Oh, and I have been employing a very "working is better than perfect" mindset writing this thing, so some of it is kind of hacked together...
Like, it's not super messy/sloppy, but it is definitely not spotless, and some of the code is definitely not perfectly optimized.
But so far everything works fast enough that I didn't think optimization was necessary.
