(function(){
  "use strict";

  // ---------------------------------------------------------------------
  // Bitmap font, 7 rows tall. Letters A-Z are 6-7 columns wide (variable
  // per letter, with real double-pixel strokes baked into the glyph
  // design itself — this is what makes them read as bold and legible
  // without any artificial column-stretching). Digits and symbols are a
  // separate, narrower 5-column design.
  // ---------------------------------------------------------------------
  const FONT = {
    "A":["0011100","0110110","1100011","1100011","1111111","1100011","1100011"],
    "B":["1111110","1100011","1100011","1111110","1100011","1100011","1111110"],
    "C":["0011110","0110011","1100000","1100000","1100000","0110011","0011110"],
    "D":["1111100","1100110","1100011","1100011","1100011","1100110","1111100"],
    "E":["1111111","1100000","1100000","1111110","1100000","1100000","1111111"],
    "F":["1111111","1100000","1100000","1111110","1100000","1100000","1100000"],
    "G":["0011110","0110011","1100000","1100111","1100011","0110011","0011111"],
    "H":["1100011","1100011","1100011","1111111","1100011","1100011","1100011"],
    "I":["111111","001100","001100","001100","001100","001100","111111"],
    "J":["0000011","0000011","0000011","0000011","0000011","1100011","0111110"],
    "K":["1100011","1100110","1101100","1111000","1101100","1100110","1100011"],
    "L":["1100000","1100000","1100000","1100000","1100000","1100000","1111111"],
    "M":["1100011","1110111","1111111","1101011","1100011","1100011","1100011"],
    "N":["1100011","1110011","1111011","1101111","1100111","1100011","1100011"],
    "O":["0011100","0110110","1100011","1100011","1100011","0110110","0011100"],
    "P":["1111110","1100011","1100011","1100011","1111110","1100000","1100000"],
    "Q":["0011100","0110110","1100011","1100011","1101111","0111110","0011011"],
    "R":["1111110","1100011","1100011","1111110","1101100","1100110","1100011"],
    "S":["0111110","1100011","1100000","0111110","0000011","1100011","0111110"],
    "T":["111111","001100","001100","001100","001100","001100","001100"],
    "U":["1100011","1100011","1100011","1100011","1100011","1100011","0111110"],
    "V":["1100011","1100011","1100011","1100011","0110110","0011100","0001000"],
    "W":["1100011","1100011","1100011","1101011","1111111","1110111","1100011"],
    "X":["1100011","1110111","0111110","0011100","0111110","1110111","1100011"],
    "Y":["110011","110011","110011","011110","001100","001100","001100"],
    "Z":["1111111","0000110","0001100","0011000","0110000","1100000","1111111"],
    "0":["01110","10001","10011","10101","11001","10001","01110"],
    "1":["00100","01100","00100","00100","00100","00100","01110"],
    "2":["01110","10001","00001","00010","00100","01000","11111"],
    "3":["11110","00001","00001","01110","00001","00001","11110"],
    "4":["00010","00110","01010","10010","11111","00010","00010"],
    "5":["11111","10000","10000","11110","00001","00001","11110"],
    "6":["01110","10000","10000","11110","10001","10001","01110"],
    "7":["11111","00001","00010","00100","01000","01000","01000"],
    "8":["01110","10001","10001","01110","10001","10001","01110"],
    "9":["01110","10001","10001","01111","00001","00001","01110"],
    "!":["00100","00100","00100","00100","00100","00000","00100"],
    "-":["00000","00000","00000","11111","00000","00000","00000"],
    "_":["00000","00000","00000","00000","00000","00000","11111"],
    "#":["01010","01010","11111","01010","11111","01010","01010"],
  };

  // ---------------------------------------------------------------------
  // Style controls: weight (stroke thickness, both row AND column),
  // density (row spacing), width (extra spacing between the glyph's own
  // pixel columns, on top of the weight-driven column thickness). "Tiny"
  // / "Dense" / "Narrow" reproduce the original 1px-per-cell look exactly.
  // ---------------------------------------------------------------------
  const WEIGHT_SCALE = {"Tiny": 1, "Regular": 2, "Bold": 4};
  const DENSITY_ROW_STEP = {"Dense": 1, "Loose": 2};
  const WIDTH_COL_STEP = {"Narrow": 1, "Medium": 2, "Wide": 3, "Very Wide": 4};

  const WEIGHT_OPTIONS = [["Tiny","Fino"], ["Regular","Regular"], ["Bold","Grueso"]];
  const DENSITY_OPTIONS = [["Loose","Suelto"], ["Dense","Denso"]];
  const WIDTH_OPTIONS = [["Narrow","Estrecho"], ["Medium","Medio"], ["Wide","Ancho"], ["Very Wide","Muy ancho"]];

  const NOTES = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
  const NOTE_SEMITONES = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
  };
  const TAMANO_VALUES = [60, 120, 240, 480, 960];

  function noteToMidi(noteName, octave){
    // Standard convention where C4 = 60.
    return 12 * (octave + 1) + NOTE_SEMITONES[noteName];
  }

  function safeFilename(label){
    let keep = "";
    for (const c of label){
      if (/[\p{L}\p{N}]/u.test(c) || " -_#".includes(c)) keep += c;
    }
    const cleaned = keep.trim().replace(/#/g, "s").replace(/ /g, "_");
    return (cleaned || "texto") + ".mid";
  }

  // ---------------------------------------------------------------------
  // Full ("real") layout: lays text out on a grid of on (col,row) cells,
  // applying weight/density/width. This is what the actual exported MIDI
  // is built from.
  //
  // colScale stays 1: the font's strokes are already multi-pixel wide by
  // design (see FONT above), so "Grosor"/weight only needs to duplicate
  // rows (rowScale) to bulk up vertically. Scaling columns on top of that
  // would stretch the already-correct glyph shapes out of proportion.
  // ---------------------------------------------------------------------
  function layoutCellsFull(text, weight, density, width, gap){
    const rowStep = DENSITY_ROW_STEP[density] || 1;
    const colStep = WIDTH_COL_STEP[width] || 1;
    const rowScale = WEIGHT_SCALE[weight] || 1;
    const colScale = 1;
    const scaledGap = gap * colScale;

    const cellSet = new Set();
    let x = 0, maxRow = 0;
    const spaceWidth = 6 * colStep * colScale;
    const upper = text.toUpperCase();

    for (const ch of upper){
      if (ch === " "){ x += spaceWidth + scaledGap; continue; }
      const glyph = FONT[ch] || FONT["-"];
      const glyphCells = new Set();
      for (let row = 0; row < glyph.length; row++){
        const bits = glyph[row];
        for (let col = 0; col < bits.length; col++){
          if (bits[col] !== "1") continue;
          const sr = row * rowStep * rowScale, sc = col * colStep * colScale;
          for (let dr = 0; dr < rowScale; dr++){
            for (let dc = 0; dc < colScale; dc++){
              glyphCells.add((sr + dr) + "," + (sc + dc));
            }
          }
        }
      }
      let glyphW;
      if (glyphCells.size > 0){
        let maxC = -Infinity;
        glyphCells.forEach(function(key){
          const c = parseInt(key.split(",")[1], 10);
          if (c > maxC) maxC = c;
        });
        glyphW = maxC + 1;
      } else {
        glyphW = 5 * colStep * colScale;
      }
      glyphCells.forEach(function(key){
        const parts = key.split(",");
        const sr = parseInt(parts[0], 10), sc = parseInt(parts[1], 10);
        cellSet.add((x + sc) + "," + sr);
        if (sr > maxRow) maxRow = sr;
      });
      x += glyphW + scaledGap;
    }

    const totalCols = Math.max(x - scaledGap, 0);
    const cells = [];
    cellSet.forEach(function(key){
      const parts = key.split(",");
      cells.push([parseInt(parts[0], 10), parseInt(parts[1], 10)]); // [col, row]
    });
    return { cells: cells, totalCols: totalCols, maxRow: maxRow };
  }

  // ---------------------------------------------------------------------
  // Cheap preview layout: same idea, but WITHOUT the NxN block explosion —
  // "Bold" would otherwise mean thousands of tiny DOM cells for the live
  // preview. Weight instead just scales how big each drawn cell is (see
  // renderPreview), so the preview stays cheap regardless of weight while
  // still reading chunkier for Bold. The real MIDI always uses
  // layoutCellsFull, which does do true NxN note-blocks, merged into long
  // notes.
  // ---------------------------------------------------------------------
  function layoutCellsPreview(text, density, gap){
    const rowStep = DENSITY_ROW_STEP[density] || 1;
    const cells = new Set();
    let x = 0, maxRow = 0;
    const spaceWidth = 6;
    const upper = text.toUpperCase();
    for (const ch of upper){
      if (ch === " "){ x += spaceWidth + gap; continue; }
      const glyph = FONT[ch] || FONT["-"];
      const glyphCells = new Set();
      for (let row = 0; row < glyph.length; row++){
        const bits = glyph[row];
        for (let col = 0; col < bits.length; col++){
          if (bits[col] !== "1") continue;
          glyphCells.add((row * rowStep) + "," + col);
        }
      }
      let glyphW = 5;
      if (glyphCells.size > 0){
        let maxC = -Infinity;
        glyphCells.forEach(function(key){
          const c = parseInt(key.split(",")[1], 10);
          if (c > maxC) maxC = c;
        });
        glyphW = maxC + 1;
      }
      glyphCells.forEach(function(key){
        const parts = key.split(",");
        const sr = parseInt(parts[0], 10), sc = parseInt(parts[1], 10);
        cells.add((x + sc) + "," + sr);
        if (sr > maxRow) maxRow = sr;
      });
      x += glyphW + gap;
    }
    return { cells: cells, totalCols: Math.max(x - gap, 0), maxRow: maxRow };
  }

  function buildPreviewGrid(text, density, gap){
    const shown = text.toUpperCase().slice(0, 40);
    const truncated = text.length > 40;
    const lay = layoutCellsPreview(shown, density, gap);
    const nCols = Math.floor(lay.totalCols) + 1;
    const cols = [];
    for (let i = 0; i < nCols; i++) cols.push(new Set());
    lay.cells.forEach(function(key){
      const parts = key.split(",");
      const cx = parseInt(parts[0], 10), row = parseInt(parts[1], 10);
      while (cols.length <= cx) cols.push(new Set());
      cols[cx].add(row);
    });
    return { cols: cols, truncated: truncated, maxRow: lay.maxRow };
  }

  // ---------------------------------------------------------------------
  // Standard MIDI File writer (format 0, single track). No external
  // library — this is the whole spec we need: header chunk, one track
  // chunk, variable-length delta times, a couple of meta events, and
  // note on/off channel events.
  // ---------------------------------------------------------------------
  function encodeVarLen(value){
    const bytes = [value & 0x7f];
    value >>>= 7;
    while (value > 0){
      bytes.unshift((value & 0x7f) | 0x80);
      value >>>= 7;
    }
    return bytes;
  }

  function buildMidiBytes(text, opts){
    const baseNote = opts.baseNote;
    const cellTicks = opts.cellTicks;
    const gap = opts.gap;
    const velocity = opts.velocity;
    const trackName = opts.trackName;
    const leadInCells = opts.leadInCells;
    const weight = opts.weight;
    const density = opts.density;
    const width = opts.width;
    let leadOutCells = (opts.leadOutCells === undefined || opts.leadOutCells === null)
      ? leadInCells : opts.leadOutCells;

    const layout = layoutCellsFull(text, weight, density, width, gap);
    const maxRow = layout.maxRow;

    // Group "on" cells by row (= by MIDI note), then merge horizontally
    // consecutive columns into single runs. One note per cell would
    // retrigger the SAME pitch at every column boundary inside a stroke —
    // exactly what shows up in the piano roll as a row of little separate
    // squares instead of one solid bar. Merging each run into a single
    // long note is what makes a horizontal stroke render as one
    // continuous block.
    const colsByRow = new Map();
    for (const [col, row] of layout.cells){
      if (!colsByRow.has(row)) colsByRow.set(row, new Set());
      colsByRow.get(row).add(col);
    }

    const runs = []; // [startCol, endColInclusive, note]
    colsByRow.forEach(function(colsSet, row){
      // Row 0 is the highest pitch so the glyph is upright in the piano roll.
      const note = baseNote + (maxRow - row);
      const colsSorted = Array.from(colsSet).sort(function(a, b){ return a - b; });
      let runStart = colsSorted[0], prev = colsSorted[0];
      for (let i = 1; i < colsSorted.length; i++){
        const c = colsSorted[i];
        if (c === prev + 1){ prev = c; continue; }
        runs.push([runStart, prev, note]);
        runStart = prev = c;
      }
      runs.push([runStart, prev, note]);
    });

    // Build every note_on / note_off as an ABSOLUTE-time event first, so
    // all the notes belonging to the same column (a vertical stroke of a
    // letter) share the exact same tick instead of being serialized one
    // after another. This is what keeps the letters looking even/aligned.
    const absEvents = []; // [tick, kind(1=on,0=off), note]
    for (const [startCol, endCol, note] of runs){
      const start = (leadInCells + startCol) * cellTicks;
      const end = (leadInCells + endCol + 1) * cellTicks;
      absEvents.push([start, 1, note]);
      absEvents.push([end, 0, note]);
    }

    // Mirror the front "Inicio" gap at the tail end so the last letter
    // isn't flush against the end of the clip. A real (if inaudible)
    // marker note — not just a trailing meta timestamp — because several
    // DAWs size an imported MIDI clip off the position of the LAST REAL
    // NOTE EVENT and silently ignore any tail that only lives in a meta
    // event. Parked four-plus octaves below anything a letter can use,
    // at the quietest possible velocity.
    const MARKER_NOTE = 0;
    const lastContentTick = absEvents.length
      ? Math.max.apply(null, absEvents.map(function(e){ return e[0]; }))
      : 0;
    const tailTick = lastContentTick + Math.max(0, leadOutCells) * cellTicks;
    if (tailTick > lastContentTick){
      absEvents.push([Math.max(lastContentTick, tailTick - 1), 1, MARKER_NOTE]);
      absEvents.push([tailTick, 0, MARKER_NOTE]);
    }

    absEvents.sort(function(a, b){ return (a[0] - b[0]) || (a[1] - b[1]); });

    const trackBytes = [];
    function pushVarLen(value){
      const enc = encodeVarLen(value);
      for (let i = 0; i < enc.length; i++) trackBytes.push(enc[i]);
    }
    function pushMeta(type, dataBytes, delta){
      pushVarLen(delta || 0);
      trackBytes.push(0xFF, type);
      const lenBytes = encodeVarLen(dataBytes.length);
      for (let i = 0; i < lenBytes.length; i++) trackBytes.push(lenBytes[i]);
      for (let i = 0; i < dataBytes.length; i++) trackBytes.push(dataBytes[i]);
    }

    const nameBytes = Array.from(new TextEncoder().encode(trackName));
    pushMeta(0x03, nameBytes, 0); // track_name

    const tempo = 500000; // 120 BPM, in microseconds per quarter note
    pushMeta(0x51, [(tempo >> 16) & 0xFF, (tempo >> 8) & 0xFF, tempo & 0xFF], 0); // set_tempo

    let lastTick = 0;
    for (const [tick, kind, note] of absEvents){
      const delta = Math.max(0, tick - lastTick);
      pushVarLen(delta);
      if (kind === 1){
        const vel = (note === MARKER_NOTE) ? 1 : velocity;
        trackBytes.push(0x90, note & 0x7F, vel & 0x7F); // note_on
      } else {
        trackBytes.push(0x80, note & 0x7F, 0); // note_off
      }
      lastTick = tick;
    }

    pushVarLen(0);
    trackBytes.push(0xFF, 0x2F, 0x00); // end_of_track

    const ticksPerBeat = 480;
    const header = [
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0, 0, 0, 6,             // chunk length = 6
      0, 0,                   // format 0
      0, 1,                   // ntrks = 1
      (ticksPerBeat >> 8) & 0xFF, ticksPerBeat & 0xFF,
    ];
    const trackLen = trackBytes.length;
    const trackHeader = [
      0x4D, 0x54, 0x72, 0x6B, // "MTrk"
      (trackLen >> 24) & 0xFF, (trackLen >> 16) & 0xFF, (trackLen >> 8) & 0xFF, trackLen & 0xFF,
    ];
    return new Uint8Array(header.concat(trackHeader, trackBytes));
  }

  // =======================================================================
  // UI wiring — everything below only runs in a browser (DOM access).
  // =======================================================================
  if (typeof document === "undefined") { return; }

  const textInput = document.getElementById("t2m-text");
  const rootSelect = document.getElementById("t2m-root");
  const scaleSelect = document.getElementById("t2m-scale");
  const labelDisplay = document.getElementById("t2m-label-display");
  const previewEl = document.getElementById("t2m-preview");
  const octaveSlider = document.getElementById("t2m-octave");
  const tamanoSlider = document.getElementById("t2m-tamano");
  const espacioSlider = document.getElementById("t2m-espacio");
  const inicioSlider = document.getElementById("t2m-inicio");
  const vOctave = document.getElementById("v-octave");
  const vTamano = document.getElementById("v-tamano");
  const vEspacio = document.getElementById("v-espacio");
  const vInicio = document.getElementById("v-inicio");
  const generateBtn = document.getElementById("t2m-generate");
  const alertEl = document.getElementById("t2m-alert");

  NOTES.forEach(function(n){
    const opt = document.createElement("option");
    opt.value = n; opt.textContent = n;
    rootSelect.appendChild(opt);
  });
  rootSelect.value = "G#";

  let weight = "Bold";
  let density = "Dense";
  let width = "Narrow";

  function currentLabel(){
    return rootSelect.value + " " + scaleSelect.value.toLowerCase() + " - " + textInput.value;
  }

  function renderBar(containerId, options, current, onPick){
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    options.forEach(function(opt){
      const internal = opt[0], lbl = opt[1];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = lbl;
      if (internal === current) btn.classList.add("active");
      btn.addEventListener("click", function(){ onPick(internal); });
      el.appendChild(btn);
    });
  }

  function redrawBars(){
    renderBar("t2m-weight-bar", WEIGHT_OPTIONS, weight, function(v){
      weight = v; redrawBars(); renderPreview();
    });
    renderBar("t2m-density-bar", DENSITY_OPTIONS, density, function(v){
      density = v; redrawBars(); renderPreview();
    });
    renderBar("t2m-width-bar", WIDTH_OPTIONS, width, function(v){
      width = v; redrawBars(); renderPreview();
    });
  }

  function renderPreview(){
    const label = currentLabel();
    const gap = parseInt(espacioSlider.value, 10);
    const grid = buildPreviewGrid(label, density, gap);
    const scale = WEIGHT_SCALE[weight] || 1;
    const nCols = Math.max(grid.cols.length, 1);
    const nRows = grid.maxRow + 1;
    const baseCell = Math.max(3, Math.min(9, Math.floor(620 / nCols)));
    const cell = baseCell * scale;

    let rowsHtml = "";
    for (let row = 0; row < nRows; row++){
      const zebra = (row % 2 === 0) ? "background:rgba(255,255,255,0.032);" : "";
      let rowHtml = "";
      for (let x = 0; x < nCols; x++){
        const on = grid.cols[x] && grid.cols[x].has(row);
        rowHtml += '<span class="t2m-cell ' + (on ? "on" : "off") +
          '" style="width:' + cell + 'px;height:' + cell + 'px;"></span>';
      }
      rowsHtml += '<div class="t2m-row" style="' + zebra + '">' + rowHtml + '</div>';
    }
    const truncNote = grid.truncated ? '<span class="t2m-trunc">preview truncado</span>' : "";

    previewEl.innerHTML =
      '<div class="t2m-preview-card">' +
      '<div class="t2m-preview-header">' + label + truncNote + '</div>' +
      '<div class="t2m-preview-body">' + rowsHtml + '</div>' +
      '</div>';
  }

  function updateLabel(){
    labelDisplay.textContent = currentLabel();
  }

  function refreshAll(){
    updateLabel();
    renderPreview();
  }

  function showAlert(msg){
    alertEl.textContent = msg;
    alertEl.classList.add("show");
    clearTimeout(showAlert._t);
    showAlert._t = setTimeout(function(){ alertEl.classList.remove("show"); }, 2400);
  }

  textInput.addEventListener("input", refreshAll);
  rootSelect.addEventListener("change", refreshAll);
  scaleSelect.addEventListener("change", refreshAll);
  espacioSlider.addEventListener("input", function(){
    vEspacio.textContent = espacioSlider.value;
    renderPreview();
  });
  octaveSlider.addEventListener("input", function(){
    vOctave.textContent = octaveSlider.value;
  });
  tamanoSlider.addEventListener("input", function(){
    vTamano.textContent = TAMANO_VALUES[parseInt(tamanoSlider.value, 10)];
  });
  inicioSlider.addEventListener("input", function(){
    vInicio.textContent = inicioSlider.value;
  });

  generateBtn.addEventListener("click", function(){
    const label = currentLabel();
    const root = rootSelect.value;
    const octave = parseInt(octaveSlider.value, 10);
    const cellTicks = TAMANO_VALUES[parseInt(tamanoSlider.value, 10)];
    const gap = parseInt(espacioSlider.value, 10);
    const leadIn = parseInt(inicioSlider.value, 10);
    const baseNote = noteToMidi(root, octave);

    const bytes = buildMidiBytes(label, {
      baseNote: baseNote,
      cellTicks: cellTicks,
      gap: gap,
      velocity: 100,
      trackName: label,
      leadInCells: leadIn,
      weight: weight,
      density: density,
      width: width,
    });

    const blob = new Blob([bytes], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename(label);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);

    showAlert("MIDI generado.");
  });

  redrawBars();
  refreshAll();
})();
