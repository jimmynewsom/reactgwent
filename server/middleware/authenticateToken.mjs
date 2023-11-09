import jwt from 'jsonwebtoken';

export default function verifyToken(req, res, next) {
  let token = req.headers['authorization'];

  if (!token)
    res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if(error)
      res.sendStatus(403);
    else{
      req.username = decoded;
      next();
    }
  });
}

export function verifyWebsocketToken(socket, next) {
  const token = socket.handshake.auth.Authorization;
  if (!token)
    next(new Error("invalid token"));

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if(error)
      next(new Error("invalid token"));
    else{
      socket.username = decoded;
      next();
    }
  });
}