// cpu.worker.ts

self.onmessage = (e: MessageEvent) => {
  if (e.data === 'start') {
    // Start intense calculations
    while (true) {
      // Math.random() and Math.sqrt are relatively heavy when run continuously
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(Math.random() * i);
        // Also do some string hashing logic to stress CPU further
        let str = "stress" + i;
        let hash = 0;
        for (let j = 0; j < str.length; j++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(j);
            hash |= 0;
        }
      }
      
      // Periodically check if we should stop. 
      // But wait, standard workers don't preempt easily if they're in an infinite while(true) block
      // To allow the worker to receive a "stop" message, we should yield back to the event loop.
      
      // Actually, if we use a while(true) loop without yielding, the worker thread will be 100% locked 
      // and won't process incoming messages (like "stop"). So we must use postMessage or setTimeout 
      // to keep the thread alive but able to receive messages, OR we can just terminate the worker from the main thread.
      // Terminating from the main thread is cleaner and guarantees it stops!
      
      // So let's just do a purely infinite loop. The main thread will call worker.terminate()!
    }
  }
};
