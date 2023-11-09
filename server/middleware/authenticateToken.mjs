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

export function verifyWebsocketToken(token) {
  if (!token)
    return {isValid: false};

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if(error)
      return {isValid: false};
    else{
      return {isValid: true, username: decoded};
    }
  });
}