module.exports = {
    makeID,
  }
  
function makeID() {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let charactersLength = characters.length;
    let amountOfDigits = 5;

    for ( var i = 0; i < amountOfDigits; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}