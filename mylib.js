async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function asyncMap(array, callback) {
    var newArray = [];
    for (let index = 0; index < array.length; index++) {
        let newVal = await callback(array[index], index, array)
        if (newVal) newArray.push(newVal)
    }
    return newArray
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

module.exports = {asyncForEach, asyncMap, wait}