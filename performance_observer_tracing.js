(function () {
  'use strict';

  function download(filename, text) {
    const blob = new Blob([text], {type: 'text/plain'});

    var element = document.createElement('a');
    element.setAttribute('href', window.URL.createObjectURL(blob));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const currentTrace = [];

  let id = 0;

  function handleEventEntry(entry) {
    const traceEvent = {
      name: "event queueing time::" + entry.name,
      cat: entry.entryType,
      pid:"Input",
      ts: entry.eventDispatchTime * 1000,
      ph: "b",
      id: "0x" + id.toString(16),
    };

    currentTrace.push(traceEvent);

    const traceEventEnd = {
      name: "event queueing time::" + entry.name,
      cat: entry.entryType,
      pid:"Input",
      ts: entry.startTime * 1000,
      ph: "e",
      id: "0x" + id.toString(16),
    };

    id++;
    currentTrace.push(traceEventEnd);
  }

  const observer = new PerformanceObserver((list) => {
    for (let entry of list.getEntries()) {
      const traceEvent = {
        name: entry.entryType + "::" + entry.name,
        cat: entry.entryType,
        pid:"Main",
        ts: entry.startTime * 1000,
      };

      if (entry.entryType == 'event') {
        handleEventEntry(entry);
      }

      if (entry.entryType == 'resource') {
        entry.url = traceEvent.name;
        traceEvent.name = 'resource';
      }

      if (entry.duration == 0) {
        traceEvent.ph = "n";
        traceEvent.s = "t";
      } else {
        traceEvent.ph = "b";
      }

      traceEvent.id = "0x" + id.toString(16);
      id++;

      let args = {};
      for (let key in entry) {
        let value = entry[key];
        if (key == "entryType" || key == "name" || key == "toJSON") {
          continue;
        }
        args[key] = value;
      }
      traceEvent.args = args;

      currentTrace.push(traceEvent);

      if (entry.duration != 0) {
        let traceEventEnd = {};
        for (let key in traceEvent) {
          traceEventEnd[key] = traceEvent[key];
        }
        traceEventEnd.ph = "e";
        traceEventEnd.ts = traceEvent.ts + entry.duration * 1000;
        console.log(traceEventEnd);
        currentTrace.push(traceEventEnd);
      }
    }
  });

  observer.observe({entryTypes: ['resource', 'navigation', 'event', 'frame', 'styleupdate']});

  window.downloadTrace = function() {
    download("performance_observer_trace.json", JSON.stringify(currentTrace));
  }
})();
