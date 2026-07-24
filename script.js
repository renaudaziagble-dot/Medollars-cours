rgb(103,245,85)const btnAnalyser = document.getElementById('btnAnalyser');
const zoneSaisie = document.getElementById('zoneSaisie');
const affichageCours = document.getElementById('affichageCours');
const btnTheme = document.getElementById('btnTheme');
const barreRecherche = document.getElementById('barreRecherche');
const btnExporter = document.getElementById('btnExporter');
const inputImage = document.getElementById('inputImage');
const inputFichier = document.getElementById('inputFichier');
const statutScan = document.getElementById('statutScan');
const texteScanne = document.getElementById('texteScanne');
const btnPhoto = document.getElementById('btnPhoto');
const btnImport = document.getElementById('btnImport');
const btnPartagerApp = document.getElementById('btnPartagerApp');
let tousLesCours = [];

document.addEventListener('DOMContentLoaded', () => {
    afficherCours();
    const maNote = localStorage.getItem('noteMedollars');
    if(maNote) { noterApp(maNote); } // RESTAURER LES ÉTOILES
});

// FONCTION INTELLIGENTE V3
function detecterClasseMatiere(texte) {
    let classe = "Sans classe";
    let matiere = "Divers";
    const premiereLigne = texte.split('\n')[0].toLowerCase();

    // 1. ON CHERCHE D'ABORD "3ème - Maths" au début
    const match = premiereLigne.match(/(\w+)\s*-\s*([\w\s-]+)/);
    if(match){
        classe = match[1].trim();
        matiere = match[2].trim();
        return {classe, matiere};
    }

    // 2. SI PAS TROUVÉ, ON DEVINE AVEC MOTS CLÉS
    texte = texte.toLowerCase();
    if(texte.includes('3ème') || texte.includes('3eme')) classe = "3ème";
    else if(texte.includes('tle') || texte.includes('terminale')) classe = "Tle";
    else if(texte.includes('1ère') || texte.includes('1ere')) classe = "1ère";

    if(texte.includes('photosynthèse') || texte.includes('cellule')) matiere = "SVT";
    else if(texte.includes('dérivée') || texte.includes('équation') || texte.includes('maths')) matiere = "Maths";
    else if(texte.includes('métaphore') || texte.includes('français')) matiere = "Français";
    else if(texte.includes('mondialisation') || texte.includes('histoire')) matiere = "HG";
    else if(texte.includes('physique') || texte.includes('chimie')) matiere = "Physique-Chimie";

    return {classe, matiere};
}

function decouperCours(texteComplet) {
    // Découpe à chaque fois qu'on voit : CP - / CE1 - / 3ème - / Tle - / Licence 1 - etc.
    return texteComplet.split(/(?=CP\s*-|CE1\s*-|CE2\s*-|CM1\s*-|CM2\s*-|6ème\s*-|5ème\s*-|4ème\s*-|3ème\s*-|2nde\s*-|1ère\s*-|Tle\s*-|Licence\s*\d\s*-|Master\s*\d\s*-)/gi)
                     .filter(c => c.trim().length > 10);
}

btnPhoto.addEventListener('click', () => inputImage.click());
btnImport.addEventListener('click', () => inputFichier.click());
inputImage.addEventListener('change', (e) => scannerFichier(e.target.files[0]));
inputFichier.addEventListener('change', (e) => scannerFichier(e.target.files[0]));

function scannerFichier(file) {
    if (!file) return;
    statutScan.textContent = 'Scan en cours...';
    Tesseract.recognize(file, 'fra').then(({ data: { text } }) => {
        zoneSaisie.value = text;
        statutScan.textContent = '✅ Scan terminé!';
    });
}

btnAnalyser.addEventListener('click', () => {
    const texte = zoneSaisie.value.trim();
    if (texte === '') { alert('Colle d\'abord ton cours 👆'); return; }

    let coursList = JSON.parse(localStorage.getItem('coursMedollars')) || [];
    const coursDecoupes = decouperCours(texte);
    let nbAjoutes = 0;

    coursDecoupes.forEach(coursTexte => {
        const {classe, matiere} = detecterClasseMatiere(coursTexte);
        coursList.push({
            id: Date.now() + nbAjoutes,
            contenu: coursTexte.trim(),
            classe: classe,
            matiere: matiere,
            date: new Date().toLocaleDateString('fr-FR')
        });
        nbAjoutes++;
    });

    localStorage.setItem('coursMedollars', JSON.stringify(coursList));
    zoneSaisie.value = '';
    afficherCours();
    alert(`${nbAjoutes} cours enregistré(s) ✅`);
});

function afficherCours() {
    tousLesCours = JSON.parse(localStorage.getItem('coursMedollars')) || [];
    if (tousLesCours.length === 0) {
        affichageCours.innerHTML = '<p style="text-align:center; color:#888;">Aucun cours enregistré.</p>';
        return;
    }
    affichageCours.innerHTML = '';
    tousLesCours.slice().reverse().forEach(c => {
        affichageCours.innerHTML += `
        <div class="exo">
            <small style="color:#FF6F00; font-weight:bold;">📚 ${c.classe} - ${c.matiere}</small>
            <small style="color:#888; float:right;">📅 ${c.date}</small>
            <pre>${c.contenu}</pre>
            <div class="btn-group">
                <button class="btn-corr btn-lire" onclick="lireCours(${c.id})">🔊 Écouter</button>
                <button class="btn-corr btn-partager" onclick="partagerCours(${c.id})">📲 Partager</button>
                <button class="btn-corr btn-supprimer" onclick="supprimerCours(${c.id})">🗑️ Supprimer</button>
            </div>
        </div>`;
    });
}

barreRecherche.addEventListener('keyup', () => {
    const terme = barreRecherche.value.toLowerCase();
    const coursFiltres = tousLesCours.filter(c =>
        c.contenu.toLowerCase().includes(terme) ||
        c.matiere.toLowerCase().includes(terme) ||
        c.classe.toLowerCase().includes(terme)
    );
    affichageCours.innerHTML = '';
    if(coursFiltres.length === 0){
        affichageCours.innerHTML = '<p style="text-align:center;">Aucun résultat</p>';
        return;
    }
    coursFiltres.slice().reverse().forEach(c => {
        affichageCours.innerHTML += `<div class="exo"><small style="color:#FF6F00; font-weight:bold;">📚 ${c.classe} - ${c.matiere}</small><small style="color:#888; float:right;">📅 ${c.date}</small><pre>${c.contenu}</pre></div>`;
    });
});

function supprimerCours(id) {
    if(confirm('Supprimer ce cours?')){
        let cours = JSON.parse(localStorage.getItem('coursMedollars')) || [];
        cours = cours.filter(c => c.id!== id);
        localStorage.setItem('coursMedollars', JSON.stringify(cours));
        afficherCours();
    }
}

function lireCours(id) {
    let cours = JSON.parse(localStorage.getItem('coursMedollars')) || [];
    const coursATrouve = cours.find(c => c.id === id);
    if(!coursATrouve) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(coursATrouve.contenu);
    speech.lang = 'fr-FR';
    window.speechSynthesis.speak(speech);
}

function partagerCours(id) {
    let cours = JSON.parse(localStorage.getItem('coursMedollars')) || [];
    const coursATrouve = cours.find(c => c.id === id);
    const textePartage = `*${coursATrouve.classe} - ${coursATrouve.matiere}*\n\n${coursATrouve.contenu}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(textePartage)}`);
}

btnExporter.addEventListener('click', () => {
    let cours = JSON.parse(localStorage.getItem('coursMedollars')) || [];
    if(cours.length === 0) { alert('Aucun cours à exporter'); return; }
    let texteExport = "MES COURS - MEDOLLARS CAHIER\n";
    cours.slice().reverse().forEach((c, index) => {
        texteExport += `COURS ${index + 1} - ${c.classe} - ${c.matiere}\n${c.contenu}\n\n----------------------------------\n\n`;
    });
    const blob = new Blob([texteExport], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Mes_Cours_MedollarsCahier.txt';
    link.click();
    alert('✅ Exporté!');
});

btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    btnTheme.textContent = document.body.classList.contains('dark')? '☀️' : '🌙';
});

// ========== PARTIE NOTES / ÉTOILES CORRIGÉE ==========
function noterApp(note) {
    localStorage.setItem('noteMedollars', note);
    const etoiles = document.querySelectorAll('#etoiles span');
    etoiles.forEach((span, i) => {
        span.style.color = i < note? 'var(--jaune)' : '#ccc';
    });
    document.getElementById('msgNote').textContent = `Merci! ${note}/5 ⭐`;
}

function resetNote(){
    localStorage.removeItem('noteMedollars');
    document.getElementById('msgNote').textContent = '';
    const etoiles = document.querySelectorAll('#etoiles span');
    etoiles.forEach(span => span.style.color = '#ccc');
}

btnPartagerApp.addEventListener('click', () => {
    window.open(`https://wa.me/?text=Telecharge *Medollars Cahier* - Ton 2eme Cahier Intelligent 100% Hors Ligne`);
});
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}