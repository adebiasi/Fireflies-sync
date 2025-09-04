// Classe Firefly
class Firefly {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.theta = random(TWO_PI);
        this.omega = 0.05 + random(-0.01, 0.01);
        this.vx = random(-1.5, 1.5);
        this.vy = random(-1.5, 1.5);
        this.radius = random(1, 6); // raggio casuale tra 1 e 4
    }

    updatePhase(K, fireflies, radius = 100) {
        let sum = 0;
        let count = 0;
        for (let other of fireflies) {
            // considera solo le firefly vicine
            let d = dist(this.x, this.y, other.x, other.y);
            if (other !== this && d < radius) {
                sum += sin(other.theta - this.theta);
                count++;
            }
        }
        // se ci sono vicini, aggiorna la fase con il sottoinsieme
        if (count > 0) {
            this.theta += this.omega + (K / count) * sum;
        } else {
            this.theta += this.omega;
        }
    }

    updatePosition() {
        // aggiungi una piccola variazione random alla velocità (movimento più naturale)
        this.vx += random(-0.1, 0.1);
        this.vy += random(-0.1, 0.1);
        // limita la velocità massima
        this.vx = constrain(this.vx, -0.1, 0.1);
        this.vy = constrain(this.vy, -0.1, 0.1);
        this.x += this.vx;
        this.y += this.vy;
        // rimbalzo ai bordi
        if (this.x < 15 || this.x > width - 15) {
            this.vx *= -1;
            this.x = constrain(this.x, 15, width - 15);
        }
        if (this.y < 15 || this.y > height - 15) {
            this.vy *= -1;
            this.y = constrain(this.y, 15, height - 15);
        }
    }

    display(redGlow = false) {
        let brightness = map(sin(this.theta), -1, 1, 20, 100);
        noStroke();
        if (redGlow) {
            // glow rosso
            fill(0, 60, brightness, 255);
            ellipse(this.x, this.y, this.radius, this.radius); // usa il raggio specifico
        } else {
            // glow normale
            fill(60, 60, brightness, 255);
            ellipse(this.x, this.y, this.radius, this.radius); // usa il raggio specifico
        }
    }
}

let K = 0.05;
let kSlider;
let fireflies = [];
let N = 50;
let syncEnabled = true; // stato della sincronizzazione
let syncButton;
let radiusSlider; // slider per il raggio di sincronizzazione
let radius = 100; // valore iniziale del raggio
let selectedIndex = -1; // indice della lucciola selezionata
let deleteAllButton; // bottone per eliminare tutte le lucciole

// GIF recording variables
let gifRecorder;
let isRecording = false;
let frameCountRecording = 0;
let maxFrames = 60; // ~2 secondi a 30 fps
let recordingMsg;

function setup() {
    colorMode(HSB, 360, 100, 100);
    // crea un contenitore principale verticale
    let mainDiv = createDiv();
    mainDiv.id('main-container');
    mainDiv.style('display', 'flex');
    mainDiv.style('flex-direction', 'column');
    mainDiv.style('align-items', 'center');
    mainDiv.style('width', '100%');

    // crea un div per i controlli
    let controlsDiv = createDiv();
    controlsDiv.id('controls');
    controlsDiv.parent(mainDiv);
    controlsDiv.style('margin-bottom', '10px');
    controlsDiv.style('display', 'flex');
    controlsDiv.style('gap', '20px');
    controlsDiv.style('align-items', 'center');
    let kLabel = createSpan('K: ');
    kLabel.parent(controlsDiv);
    kLabel.style('margin-right', '5px');
    kLabel.style('font-size', '16px');
    kLabel.style('color', '#fff');
    kSlider = createSlider(0, 0.2, K, 0.001);
    kSlider.parent(controlsDiv);
    kSlider.style('width', '200px');
    kSlider.style('margin-right', '20px');
    let rLabel = createSpan('Radius: ');
    rLabel.parent(controlsDiv);
    rLabel.style('margin-right', '5px');
    rLabel.style('font-size', '16px');
    rLabel.style('color', '#fff');
    radiusSlider = createSlider(20, 300, radius, 1);
    radiusSlider.parent(controlsDiv);
    radiusSlider.style('width', '200px');
    radiusSlider.style('margin-right', '20px');
    syncButton = createButton('Disable synchronization');
    syncButton.parent(controlsDiv);
    syncButton.mousePressed(toggleSync);
    syncButton.style('font-size', '16px');
    syncButton.style('margin-left', '20px');

    // imposta lo sfondo del div
    controlsDiv.style('background', '#222');
    controlsDiv.style('padding', '10px 20px');
    controlsDiv.style('border-radius', '10px');
    controlsDiv.style('width', 'max-content');

    // Bottone per eliminare tutte le lucciole
    deleteAllButton = createButton('Clear All');
    deleteAllButton.parent(controlsDiv);
    deleteAllButton.style('font-size', '16px');
    deleteAllButton.style('margin-left', '20px');
    deleteAllButton.mousePressed(() => {
        fireflies = [];
        selectedIndex = -1;
    });

    // crea il canvas e lo mette come figlio del contenitore principale
    let cnv = createCanvas(1200, 800);
    cnv.parent(mainDiv);

    for (let i = 0; i < N; i++) {
        fireflies.push(new Firefly(random(50, width-50), random(50, height-50)));
    }
}

function toggleSync() {
    syncEnabled = !syncEnabled;
    if (syncEnabled) {
        syncButton.html('Disable synchronization');
    } else {
        syncButton.html('Enable synchronization');
    }
}

function draw() {
    background(0);
    K = kSlider.value();
    radius = radiusSlider.value();
    // aggiorna posizione e fase di tutte le lucciole
    for (let f of fireflies) {
        if (syncEnabled) {
            f.updatePhase(K, fireflies, radius);
        } else {
            f.theta += f.omega;
        }
        f.updatePosition();
    }
    // visualizza il perimetro e le vicine per la lucciola selezionata
    if (fireflies.length > 0) {
        let ref = fireflies[selectedIndex];
        // disegna il cerchio del raggio di sincronizzazione
        noFill();
        stroke(0, 0, 100, 80);
        strokeWeight(2);
        if (ref !== undefined) {
            ellipse(ref.x, ref.y, radius * 2, radius * 2);
        }
        // disegna tutte le lucciole, colorando di rosso le vicine
        for (let i = 0; i < fireflies.length; i++) {
            let f = fireflies[i];
            if (ref !== undefined && f !== ref && dist(ref.x, ref.y, f.x, f.y) < radius) {
                f.display(true); // glow rosso
            } else {
                f.display(false); // glow normale
            }
        }
        if (ref !== undefined) {
            ref.display(true);
        }
    }
    // UI text
    noStroke();
    fill(255);
    textSize(16);
    text('K = ' + K.toFixed(3), 20, 35);
    text('Radius = ' + radius + ' px', 20, 50);

    // GIF recording
    if (isRecording) {
        gifRecorder.addFrame(document.getElementById('defaultCanvas0'), {copy: true, delay: 1000/30});
        frameCountRecording++;
        if (frameCountRecording >= maxFrames) {
            isRecording = false;
            recordingMsg.html('Rendering GIF...');
            gifRecorder.on('finished', function(blob) {
                let url = URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = 'fireflies.gif';
                document.body.appendChild(a);
                setTimeout(() => {
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    // Mostra sempre il messaggio GIF saved!
                    if (!recordingMsg) {
                        recordingMsg = createDiv('GIF saved!');
                        recordingMsg.style('position', 'absolute');
                        recordingMsg.style('top', '10px');
                        recordingMsg.style('left', '50%');
                        recordingMsg.style('transform', 'translateX(-50%)');
                        recordingMsg.style('background', '#222');
                        recordingMsg.style('color', '#fff');
                        recordingMsg.style('padding', '8px 20px');
                        recordingMsg.style('border-radius', '8px');
                        recordingMsg.style('font-size', '18px');
                        recordingMsg.style('z-index', '1000');
                    } else {
                        recordingMsg.html('GIF saved!');
                        recordingMsg.show();
                    }
                    setTimeout(() => {
                        if (recordingMsg) recordingMsg.hide();
                    }, 5000); // Mostra per 5 secondi
                }, 100);
            });
            gifRecorder.render();
            console.log('GIF recording finished');
        }
    }
}

function mousePressed() {

console.log("mousePressed", mouseX, mouseY);
    // ignora click fuori dal canvas
    if(mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height){
        return;
    }
    // seleziona la lucciola più vicina al click
    let minDist = 9999;
    let idx = -1;
    for (let i = 0; i < fireflies.length; i++) {
        let d = dist(mouseX, mouseY, fireflies[i].x, fireflies[i].y);
        if (d < minDist && d < 15) {
            minDist = d;
            idx = i;
        }
    }
    if (idx !== -1) {
        // se riseleziono la stessa, togli la selezione
        if (selectedIndex === idx) {
            selectedIndex = -1;
        } else {
            selectedIndex = idx;
        }
    } else {
        // se nessuna lucciola è vicina, crea una nuova
        fireflies.push(new Firefly(mouseX, mouseY));
        // selectedIndex = fireflies.length - 1;
    }
}

function keyPressed() {
    if (key === 'G' || key === 'g') {
        saveGif('mySketch', 5);

    }
}
