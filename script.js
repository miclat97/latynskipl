const dictENtoPL = {
  "no description": "Brak opisu",
  "": "Brak opisu",

  "application in .net 8 for sending end-to-end encrypted messages and photos. messages are encrypted using the aes algorithm with a key length of 256 bits. the application uses the mvc pattern and razor technology.":
    "Aplikacja w .NET 8 do wysyłania wiadomości i zdjęć szyfrowanych end-to-end. Wiadomości są szyfrowane algorytmem AES z kluczem o długości 256 bitów. Aplikacja wykorzystuje wzorzec MVC i technologię Razor.",

  "api in .net 8 for \"to do\" app using cqrs, mediatr, unitofwork, baserepository patterns with tests in xunit - with docker support":
    "API w .NET 8 dla aplikacji typu „To do” z wykorzystaniem wzorców CQRS, MediatR, UnitOfWork, BaseRepository oraz testów w xUnit - z obsługą Dockera.",

  "windows desktop in wpf (.net 8) application to view images and any other filetype - view it content (as ascii characters)":
    "Aplikacja desktopowa Windows w WPF (.NET 8) do przeglądania obrazów i innych typów plików - wyświetlanie ich zawartości (jako znaki ASCII).",

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
    "Nieoficjalny klient Signal Private Messenger dla Windows."
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
			container.innerHTML = "<p><a href=\"https://github.com/miclat97\">💼 Przejdź bezpośrednio na mojego GitHuba</a></p>";	
		}
		else{
			container.innerHTML = "<p><a href=\"https://github.com/miclat97\">💼 Go to my GitHub directly</a></p>";	
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
		<p class="justified">Jestem entuzjastą technologii, programistą (głównie w technologiach .NET, język C#), fanem systemów operacyjnych z rodziny Windows jak i innych technologii Microsoftu, takich jak Hyper-V czy chmury Azure. Ale nie samym Windowsem zyją komputery (i serwery, a może powinienem napisać "głównie serwery"? ;)<br />
		Jeśli chodzi o systemy oparte na jądrze GNU/Linux, to najwięcej pozytywnych doświadczeń mam z dystrybucjami Debianopochodnymi, a dokładniej mówiąc chodzi mi o Debiana i Ubuntu.
		Niemniej ciekawą stroną komputerów jest dla mnie ich warstwa sprzętowa - zarówno rzeczy teoretyczne jak architektury procesorów ale jeszcze bardziej praktyczne - czyli mówiąc prostszymi słowami lubię eksperymentować ze sprzętem komputerowym i inną elektroniką, a do tego zawsze staram się być na bieżąco z nowościami sprzętowymi.<br />
		Ostatnim obszarem o którym chciałbym wspomnieć w tym krótkim opisie to cyberbezpieczeństwo - kwestiami cybersecurity zacząłem interesować się dopiero około 2 lat temu, jednak moja wiedza w tych kwestiach stopniowo rośnie :)</p>
`;

const aboutTextEN = `
		<h2>About me</h2>
		<p class="justified">I'm a technology enthusiast, .NET developer and Windows passionate, with a love for turning ideas into practical solutions. PowerShell, Process Explorer, ProcMon, Hyper‑V, or MMC snap‑ins - all these tools are familiar to me. I'm also exploring the GNU/Linux world, especially Debian‑based distributions. My fascination is also computer hardware and I'm always curious about the latest tech trends. Cybersecurity is my biggest focus in recent years. I enjoy experimenting in my homelab, where I can learn, test and have fun all the time :)</p>
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
