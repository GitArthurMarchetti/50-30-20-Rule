function binarySearch(sortedArray, targetValue) {
    let startIndex = 0
    let endIndex = sortedArray.length - 1
  
    while (startIndex <= endIndex) {
      let middleIndex = Math.floor((startIndex + endIndex) / 2)
      let middleValue = sortedArray[middleIndex]
  
      if (middleValue === targetValue) {
        return middleIndex
      }
  
      if (middleValue < targetValue) {
        startIndex = middleIndex + 1
      } else {
        endIndex = middleIndex - 1
      }
    }
  
    return -1
  }
  
  const myList = [1, 3, 5, 7, 9, 11]
  const myTarget = 7
  
  const result = binarySearch(myList, myTarget)
  console.log(result)