let pyodidePromise = null;

async function getPyodide() {
  if (!pyodidePromise) {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    pyodidePromise = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'
    });
  }
  return pyodidePromise;
}

self.onmessage = async (event) => {
  const { id, code, tests = [] } = event.data;
  try {
    const pyodide = await getPyodide();
    pyodide.globals.set('__academy_code_js', String(code || ''));
    pyodide.globals.set('__academy_tests_js', JSON.stringify(tests));

    const raw = await pyodide.runPythonAsync(`
import io
import json
import sys
import traceback

code = __academy_code_js
tests = json.loads(__academy_tests_js)
env = {}
buffer = io.StringIO()
error_text = None
old_stdout = sys.stdout

try:
    sys.stdout = buffer
    exec(code, env)
except Exception:
    error_text = traceback.format_exc()
finally:
    sys.stdout = old_stdout

output = buffer.getvalue()
checks = []
if error_text is None:
    for test in tests:
        try:
            scope = dict(env)
            scope['__academy_output'] = output
            passed = bool(eval(test['expression'], scope, scope))
            checks.append({'name': test['name'], 'passed': passed, 'error': None})
        except Exception as exc:
            checks.append({'name': test['name'], 'passed': False, 'error': str(exc)})

json.dumps({'output': output, 'error': error_text, 'tests': checks}, ensure_ascii=False)
    `);

    self.postMessage({ id, ok: true, result: JSON.parse(raw) });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
