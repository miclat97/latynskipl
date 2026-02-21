const dictENtoPL = {
  "no description": "Brak opisu",
  "": "Brak opisu",

  "application in .net 8 for sending end-to-end encrypted messages and photos. messages are encrypted using the aes algorithm with a key length of 256 bits. the application uses the mvc pattern and razor technology.":
    "Aplikacja w .NET 8 do wysyłania wiadomości i zdjęć szyfrowanych end-to-end. Wiadomości są szyfrowane algorytmem AES z kluczem o długości 256 bitów. Aplikacja wykorzystuje wzorzec MVC i technologię Razor.",
	
  "windows service written in .net 10 working on windows devices used as hosts to share any legacy printer with any other device, like arm android or ios phones, which haven't got dedicated drivers to use. also contains management tools to force purge stuck documents in printer queue.":
    "Aplikacja w .NET 10 działająca jako usługa systemowa pozwalająca na udostępnienie w sieci lokalnej starej drukarki, do której teoretycznie nowsze urządzenia, jak telefony z Androidem/iOS nie mają żadnych sterowników, przez stale działający np. stary komputer/tablet z Windowsem. Ta strona tworzy serwer www do którego każde urządzenie może wysłać dowolny plik PDF, lub zdjęcie, które po przetworzeniu i wyrenderowaniu zostanie bezpośrednio wydrukowane na drukarce podłączonej przez USB do tego Windowsowego serwera.",

  "api in .net 8 for \"to do\" app using cqrs, mediatr, unitofwork, baserepository patterns with tests in xunit - with docker support":
    "API w .NET 8 dla aplikacji typu „To do” z wykorzystaniem wzorców CQRS, MediatR, UnitOfWork, BaseRepository oraz testów w xUnit - z obsługą Dockera.",

  "windows desktop application in .net 10 (wpf) to quickly open any filetype - with built-in file explorer as well. app can open and play videos, music, open, zoom or scale images as well. program can also open any text document or any other file and read it as text (ascii characters)":
    "Aplikacja desktopowa w .NET 10 (WPF) do szybkiego przeglądania wszystkich typów plików (z wbudowanym eksploratorem plików). Potrafi odtwarzać filmy, muzykę, otwierać, powiększać oraz skalować zdjęcia. Program jest w stanie też odczytać dowolny tekst z każdego innego typu pliku (w formie zwykłych znaków ASCII)",

  "simple calculator plugin to enova 365 erp with unit tests in .net framework 4.6.1":
    "Prosta wtyczka kalkulatora do Enova 365 ERP z testami jednostkowymi w .NET Framework 4.6.1.",

  "a suite of tools for managing the fans in many dell laptops. goal for this fork: create an easy ui for to lock the fan at any chosen rpm":
    "Zestaw narzędzi do zarządzania wentylatorami w wielu laptopach Dell. Cel tego forka: stworzenie prostego interfejsu do blokowania wentylatora na dowolnych obrotach RPM.",

  "simple console app in .net 8 to convert subtitles from 'strange' json to normal form of subtitles (vtt)":
    "Prosta aplikacja konsolowa w .NET 8 do konwersji napisów z „nietypowego” formatu JSON do standardowego formatu napisów (VTT).",

  "windows desktop application which is fork from openai-api-dotnet wrapper to access api openai":
    "Aplikacja desktopowa Windows będąca forkiem wrappera OpenAI-API-dotnet do korzystania z API OpenAI.",

  "this is a simple project in .net 8 encrypting users messages, photos and other files by the server side.":
    "Prosty projekt w .NET 8 szyfrujący wiadomości, zdjęcia i inne pliki użytkowników po stronie serwera.",

  "[.net] m3u8 downloader":
    "Pobieracz plików m3u8 w [.NET].",

  "unofficial signal private messenger for windows":
    "Nieoficjalny klient Signal Private Messenger dla Windows.",

  "my simple website and a pwa app as well. written from scratch in vanilla javascript, html and css":
    "Moja prosta strona wizytówka a zarazem aplikacja PWA. Napisana w czystym javascript, html i css",

  "backend in .net for the application on idea kielce 2019 hackathon. the application is used to search for stores open on non-commercial sundays.":
    "Backend w .NET do aplikacji na hackathon IDEA KIELCE 2019. Aplikacja pozwala na wyszukiwanie otwartych sklepów w niedziele niehandlowe w Polsce",
	
	"gui to built-in windows 'robocopy' tool in .net 8 - winforms":
	"GUI do wbudowanego narzędzia w Windowsa 'robocopy' w .NET 8 oraz WinForms",
	
	"simple console app in .net framework 4.7.2 to backup outlook calendar automatically and save it in documents user folder in .ics format":
	"Prosta aplikacja konsolowa w .NET Frameworku 4.7.2 do automatycznego backupowania kalendarza z Outlooka i zapisania go w formie pliku .ics w folderze dokumentów użytkownika"
};

function translateDescription(text) {
  if (!text) return dictENtoPL["no description"];
  const key = text.trim().toLowerCase();
  return dictENtoPL[key] || text;
}

function checkIfDescritpionExists(text){
	if(!text) return "";
	return text;
}

let cachedRepos = [];

const staticGithubUrl = "https://github.com/miclat97";

fetch("https://api.github.com/users/miclat97/repos?sort=updated")
  .then(res => res.json())
  .then(data => {
    cachedRepos = data.slice(0, 6);
    renderProjects("EN");
  })
  .catch(err => {
    console.error(err);
  });
  
function renderProjects(lang) {
	const container = document.getElementById("project-list");
		  
	if(cachedRepos.length == 0){
		if(lang === "PL"){
			container.innerHTML = "<a href=\"https://github.com/miclat97\" class=\"button-blue-gradient\">Mój GitHub</a>";
		}
		else{
			container.innerHTML = "<a href=\"https://github.com/miclat97\" class=\"button-blue-gradient\">Go to my GitHub</a>";
		}
	}else{
		container.innerHTML = "";

		cachedRepos.forEach(repo => {
			const card = document.createElement("div");
			card.className = "project-card";

		let desc = repo.description || "No description";
		if (lang === "PL") {
			  desc = translateDescription(desc);
			  card.innerHTML = `
				  <h3>${repo.name}</h3>
				  <p class="justified">${desc}</p>
				  <a href="${repo.html_url}" target="_blank">Zobacz na GitHubie</a>
				  `;
			  container.appendChild(card);
		}else{
			  card.innerHTML = `
				  <h3>${repo.name}</h3>
				  <p class="justified">${desc}</p>
				  <a href="${repo.html_url}" target="_blank">View on GitHub</a>
				  `;
			  container.appendChild(card);		
			}
		  });
	}
}


const aboutTextPL = `
		<h2>O mnie</h2>
		<p class="justified">Cześć! Tą domenę zarejestrowałem głównie w celu posiadania maila w stylu: imie@nazwisko. To tak słowem krótkiego wyjaśnienia, ale jeśli już tu jesteś to zapraszam na mojego GitHuba, lub do zagrania w prostą grę przeglądarkową, dostępną na dole tej strony "Koci bananiarz game"! :)</p>
`;

const aboutTextEN = `
		<h2>About me</h2>
		<p class="justified">Hi! This domain exists mainly for my custom email. While I'm figuring out my future blog, you can scroll down to check out my GitHub projects or play a mini browser game. Enjoy!<p>
`;

const headerBottomEN = '';
const headerBottomPL = '';
const headerAboutEN = `About`;
const headerAboutPL = `O mnie`;
const headerProjectsEN = `Projects`;
const headerProjectsPL = `Projekty`;
const headerContactEN = `Contact`;
const headerContactPL = `Kontakt`;
const headerGithubEN = `Last updates on my GitHub`;
const headerGithubPL = `Najnowsze na moim GitHub'ie`;
const translateButtonPL = 'EN';
const translateButtonEN = 'PL';

let isPolish = true;

function toggleLanguage() {
  const aboutBox = document.getElementById("about-box");
  const headerBottom = document.getElementById("header-bottom");
  const headerAbout = document.getElementById("header-about");
  const headerProjects = document.getElementById("header-projects");
  const headerContact = document.getElementById("header-contact");
  const headerGithub = document.getElementById("header-github");
  const sectionContactHeader = document.getElementById("section-contact-header");
  const button = document.getElementById("lang-toggle");

  if (isPolish) {
    aboutBox.innerHTML = aboutTextEN;
	headerBottom.innerHTML = headerBottomEN;
	headerAbout.innerHTML = headerAboutEN;
	headerProjects.innerHTML = headerProjectsEN;
	headerContact.innerHTML = headerContactEN;
	headerGithub.innerHTML = headerGithubEN;
	sectionContactHeader.innerHTML = headerContactEN;
    button.textContent = translateButtonEN;
	renderProjects("EN");
    isPolish = false;
  } else {
    aboutBox.innerHTML = aboutTextPL;
	headerBottom.innerHTML = headerBottomPL;
	headerAbout.innerHTML = headerAboutPL;
	headerProjects.innerHTML = headerProjectsPL;
	headerContact.innerHTML = headerContactPL;
	headerGithub.innerHTML = headerGithubPL;
	sectionContactHeader.innerHTML = headerContactPL;
	button.textContent = translateButtonPL;
	renderProjects("PL");
    isPolish = true;
  }
}


window.onload = function() {
  toggleLanguage();
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => console.log("ServiceWorker registred:", reg.scope))
      .catch(err => console.error("RegisterWorker registration failed, error:", err));
  });
}
