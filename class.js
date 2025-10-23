
function interpolationSearch(array, target) {



    let low = 0;
    let high = array.length - 1;

    while (low <= high && target >= array[low] && target <= array[high]) {
      


      if (low === high) {
          if (array[low] === target) {
              return low;
          }
          return -1; 
      }
  
      //math stuff
      let pos = low + Math.floor(((target - array[low]) * (high - low)) / (array[high] - array[low]));
  


      if (array[pos] === target) {
        return pos;
      }



      if (array[pos] < target) {
        low = pos + 1;
      } 
      else {
        high = pos - 1;
      }


    }
  
    return -1;
  }
  
  
  const arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  
  const target1 = 40;
  const target2 = 45; 
  
  console.log(`Array: [${arr.join(', ')}]`);

  let index1 = interpolationSearch(arr, target1);
  console.log(index1 !== -1 ? `element ${target1} search in ${index1}.` : `elemnt ${target1} not found.`);
  
  let index2 = interpolationSearch(arr, target2);
  console.log(index2 !== -1 ? `elemeent ${target2} found in ${index2}.` : `element ${target2} not found.`);
  
  const largeArray = [];
  for (let i = 1; i <= 100; i++) {
      largeArray.push(i * 5); 
  }


  const target3 = 250;
  let index3 = interpolationSearch(largeArray, target3);
  console.log(index3 !== -1 ? `elemnt ${target3} found  in ${index3}.` : `element ${target3} not found.`);
  