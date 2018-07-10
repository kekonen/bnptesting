async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function asyncMap(array, callback) {
    try{
        var newArray = [];
        for (let index = 0; index < array.length; index++) {
            let newVal = await callback(array[index], index, array)
            if (newVal) newArray.push(newVal)
        }
        return newArray
    } catch(e) {
        throw e
    }
}

var wait = async (seconds) => {
    var i = 0;
    var timerId = setInterval(() => {i+=1;console.log(`${i} out of ${seconds} seconds passed`)}, 1000)

    var prom = new Promise((resolve, reject) =>{
        setTimeout(() => {
            clearInterval(timerId);
            console.log(`${seconds} out of ${seconds} seconds passed\n`)
            resolve('done')
        }, seconds*1000);
    })

    return prom
}

var retry = async (func, {options = [], message = '', attemptsLeft=10, waitBetween=3, waitBefore=0}) => {
    if (waitBefore) await wait(waitBefore)

    while (attemptsLeft) {
        try {
            var result = await func(...options)
            return result
        } catch(e){
            attemptsLeft -= 1
            console.log(`\n -> Ooops! ${message}. Retries left ${attemptsLeft}\n`)
            if (attemptsLeft == 0) throw new Error(`Cycle ended`)
            else await wait(waitBetween);
        }
    }
}

var deepEqual = function (x, y) {
    if (x === y) {
        return true;
    }
    else if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
        if (Object.keys(x).length != Object.keys(y).length)
            return false;
  
        for (var prop in x) {
            if (y.hasOwnProperty(prop))
            {  
                if (! deepEqual(x[prop], y[prop]))
                    return false;
            }
            else
                return false;
        }
  
        return true;
    }
    else 
        return false;
}

module.exports = {asyncForEach, asyncMap, wait, retry, deepEqual}