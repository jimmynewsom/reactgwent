import jwt from 'jsonwebtoken';

export default function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  console.log(token);

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