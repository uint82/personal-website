interface Track {
  title: string;
  artist: string;
  url: string;
}

const playlist: Track[] = [
  {
    title: "Gymnopedie No. 1",
    artist: "Prodigal Procrastinator",
    url: "https://www.orangefreesounds.com/wp-content/uploads/2016/05/Erik-satie-gymnopedie-no1-piano.mp3?_=1",
  },
  {
    title: "Arabesque No. 1",
    artist: "Luc Laporte Sr",
    url: "https://www.orangefreesounds.com/wp-content/uploads/2016/02/Debussy-arabesque-no-1.mp3?_=1",
  },
  {
    title: "Chopin Waltz In A Minor, B. 150",
    artist: "Aya Higuchi",
    url: "https://www.orangefreesounds.com/wp-content/uploads/2017/03/Chopin-waltz-in-a-minor.mp3?_=1",
  },
  {
    title: "Chopin Waltz Op 64 No 2 In C Sharp Minor",
    artist: "Olga Gurevich",
    url: "https://www.orangefreesounds.com/wp-content/uploads/2018/07/Chopin-waltz-op-64-no-2-in-c-sharp-minor.mp3?_=1",
  },
];

let currentTrackIndex = 0;
let isPlaying = false;
let tonearmTimer: ReturnType<typeof setTimeout> | null = null;

let audio: HTMLAudioElement;
let trackTitle: HTMLElement;
let trackArtist: HTMLElement;
let vinylLabelText: HTMLElement;
let vinylDisc: HTMLElement;
let tonearm: HTMLElement;
let playBtn: HTMLButtonElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;
let playIcon: HTMLElement;
let pauseIcon: HTMLElement;
let progressBar: HTMLElement;
let progressFill: HTMLElement;
let volumeSlider: HTMLInputElement;
let volumeText: HTMLElement;

function init() {
  audio = document.getElementById("audio-player") as HTMLAudioElement;
  trackTitle = document.getElementById("track-title") as HTMLElement;
  trackArtist = document.getElementById("track-artist") as HTMLElement;
  vinylLabelText = document.getElementById("vinyl-label-text") as HTMLElement;
  vinylDisc = document.getElementById("vinyl-disc") as HTMLElement;
  tonearm = document.getElementById("tonearm") as HTMLElement;
  playBtn = document.getElementById("play-btn") as HTMLButtonElement;
  prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
  nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
  playIcon = document.getElementById("play-icon") as HTMLElement;
  pauseIcon = document.getElementById("pause-icon") as HTMLElement;
  progressBar = document.getElementById("progress-bar") as HTMLElement;
  progressFill = document.getElementById("progress-fill") as HTMLElement;
  volumeSlider = document.getElementById("volume-slider") as HTMLInputElement;
  volumeText = document.getElementById("volume-text") as HTMLElement;

  if (!audio || !playBtn) {
    console.error("Music Player: required elements missing");
    return;
  }

  audio.volume = 0.5;
  volumeSlider.value = "50";
  handleVolumeChange();

  loadTrack(currentTrackIndex, true);

  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", prevTrack);
  nextBtn.addEventListener("click", nextTrack);
  progressBar.addEventListener("click", seek);
  volumeSlider.addEventListener("input", handleVolumeChange);

  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("ended", () => changeTrack((currentTrackIndex + 1) % playlist.length));

  window.addEventListener("resize", checkTitleScroll);

  tonearm.classList.add("resting");
}

function loadTrack(index: number, isInitial = false) {
  const track = playlist[index];

  audio.src = track.url;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  vinylLabelText.textContent = track.title;

  progressFill.style.width = "0%";
  vinylDisc.style.transform = "";
  vinylDisc.style.animationDelay = "";
  vinylDisc.classList.remove("spinning");

  if (!isInitial) {
    if (tonearmTimer !== null) {
      clearTimeout(tonearmTimer);
      tonearmTimer = null;
    }
    tonearm.classList.remove("playing", "paused", "resting");
    tonearm.classList.add("lifting");
    tonearmTimer = setTimeout(() => {
      tonearm.classList.remove("lifting");
      tonearm.classList.add("resting");
      tonearmTimer = null;
    }, 850);
  }

  requestAnimationFrame(checkTitleScroll);
}

function changeTrack(newIndex: number) {
  const wasPlaying = isPlaying;

  audio.pause();
  isPlaying = false;
  const angle = getFrozenAngle();
  vinylDisc.classList.remove("spinning");
  vinylDisc.style.animationDelay = "";
  vinylDisc.style.transform = `rotate(${angle}deg)`;

  if (tonearmTimer !== null) {
    clearTimeout(tonearmTimer);
    tonearmTimer = null;
  }

  const swapTrack = () => {
    currentTrackIndex = newIndex;
    const track = playlist[currentTrackIndex];
    audio.src = track.url;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    vinylLabelText.textContent = track.title;
    progressFill.style.width = "0%";
    vinylDisc.style.transform = "";
    vinylDisc.style.animationDelay = "";
    requestAnimationFrame(checkTitleScroll);
  };

  const dropArm = () => {
    tonearm.classList.remove("lifting", "resting");
    tonearm.classList.add("playing");
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    tonearmTimer = setTimeout(() => {
      vinylDisc.classList.add("spinning");
      audio.play().catch(console.error);
      isPlaying = true;
      tonearmTimer = null;
    }, 800);
  };

  const armIsResting = tonearm.classList.contains("resting");

  if (armIsResting) {
    swapTrack();
    if (wasPlaying) {
      tonearmTimer = setTimeout(dropArm, 200);
    }
  } else {
    tonearm.classList.remove("playing", "resting");
    tonearm.classList.add("lifting");
    tonearmTimer = setTimeout(() => {
      swapTrack();
      if (wasPlaying) {
        tonearmTimer = setTimeout(dropArm, 200);
      } else {
        tonearm.classList.remove("lifting");
        tonearm.classList.add("resting");
        tonearmTimer = null;
      }
    }, 850);
  }
}

function nextTrack() {
  changeTrack((currentTrackIndex + 1) % playlist.length);
}

function prevTrack() {
  changeTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);
}

function togglePlay() {
  isPlaying ? pause() : play();
}

function play() {
  if (tonearmTimer !== null) {
    clearTimeout(tonearmTimer);
    tonearmTimer = null;
  }
  tonearm.classList.remove("lifting", "resting");
  tonearm.classList.add("playing");
  playIcon.style.display = "none";
  pauseIcon.style.display = "block";

  const currentAngle = getFrozenAngle();
  const SPIN_DURATION = 3;
  const normalised = ((currentAngle % 360) + 360) % 360;
  const animDelay = -((normalised / 360) * SPIN_DURATION);
  tonearmTimer = setTimeout(() => {
    vinylDisc.style.transform = "";
    vinylDisc.style.animationDelay = `${animDelay}s`;
    vinylDisc.classList.add("spinning");
    audio.play().catch(console.error);
    isPlaying = true;
    tonearmTimer = null;
  }, 800);
}

function pause() {
  audio.pause();
  isPlaying = false;

  const angle = getFrozenAngle();
  vinylDisc.classList.remove("spinning");
  vinylDisc.style.animationDelay = "";
  vinylDisc.style.transform = `rotate(${angle}deg)`;

  if (tonearmTimer !== null) {
    clearTimeout(tonearmTimer);
    tonearmTimer = null;
  }
  tonearm.classList.remove("playing");
  tonearm.classList.add("lifting");
  tonearmTimer = setTimeout(() => {
    tonearm.classList.remove("lifting");
    tonearm.classList.add("resting");
    tonearmTimer = null;
  }, 850);

  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
}

function getFrozenAngle(): number {
  const matrix = new DOMMatrix(getComputedStyle(vinylDisc).transform);
  return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
}

function handleVolumeChange() {
  const volume = parseInt(volumeSlider.value, 10);
  audio.volume = volume / 100;
  volumeText.textContent = `${volume}%`;
}

function updateProgress() {
  if (!audio.duration) return;
  progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
}

function seek(e: MouseEvent) {
  if (!audio.duration) return;

  const rect = progressBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
}

function checkTitleScroll() {
  trackTitle.classList.remove("scrolling");

  if (trackTitle.scrollWidth > trackTitle.clientWidth) {
    trackTitle.classList.add("scrolling");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
