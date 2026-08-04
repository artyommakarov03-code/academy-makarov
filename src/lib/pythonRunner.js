let runCounter = 0;

export function runPython(code, tests, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const workerUrl = new URL('./pyodide-worker.js', document.baseURI);
    const worker = new Worker(workerUrl);
    const id = ++runCounter;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        output: '',
        error: 'Выполнение остановлено: программа работала слишком долго.',
        tests: []
      });
    }, timeoutMs);

    worker.onmessage = (event) => {
      if (event.data?.id !== id) return;
      if (event.data.ok) finish(event.data.result);
      else finish({ output: '', error: event.data.error, tests: [] });
    };

    worker.onerror = (event) => {
      finish({
        output: '',
        error: event.message || 'Не удалось загрузить Python-движок.',
        tests: []
      });
    };

    worker.postMessage({ id, code, tests });
  });
}
