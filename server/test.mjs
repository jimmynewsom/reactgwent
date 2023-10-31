import validator from "validator";

function sanitizeInput(input){
  return validator.blacklist(input, "$.<>");
}

console.log(sanitizeInput("test $$..<><> test"));