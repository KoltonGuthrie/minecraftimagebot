const fetch = require("node-fetch");
const AbortController = require("abort-controller");
const HttpStatus = require("http-status-codes");

function timeoutPromise(ms, promise) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("promise timeout"));
      }, ms);
      promise.then(
        (res) => {
          clearTimeout(timeoutId);
          resolve(res);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      );
    });
  }

async function main(url, timeout) {
    const controller = new AbortController();
    const signal = controller.signal;
  
    try {
      res = await timeoutPromise(
        timeout,
        fetch(
          `https://minecraftimagebot.glitch.me/downloadimg?url=${encodeURIComponent(
            url
          )}`,
          { method: "get", headers: { mode: "no-cors" }, signal: signal }
        )
      );
    } catch (err) {
      controller.abort();
      return { status: 0, type: null, reason: `Connection Timeout. Connection exceeded ${timeout/1000}s` };
    }
    const resHeader = await res.headers.get("Content-Type");
    const reason = HttpStatus.getStatusText(res.status);
  
    return { status: res.status, type: resHeader, reason: reason };
  }

module.exports = {
    checkurl: main,
}