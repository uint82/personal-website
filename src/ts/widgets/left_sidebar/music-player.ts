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
];

let currentTrackIndex = 0;
let isPlaying = false;

let audio: HTMLAudioElement;
let trackTitle: HTMLElement;
let trackArtist: HTMLElement;
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

  audio.volume = 0.7;
  volumeSlider.value = "70";
  handleVolumeChange();

  loadTrack(currentTrackIndex);

  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", prevTrack);
  nextBtn.addEventListener("click", nextTrack);
  progressBar.addEventListener("click", seek);
  volumeSlider.addEventListener("input", handleVolumeChange);

  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("ended", nextTrack);

  window.addEventListener("resize", checkTitleScroll);
}

function loadTrack(index: number) {
  const track = playlist[index];

  audio.src = track.url;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;

  progressFill.style.width = "0%";

  requestAnimationFrame(checkTitleScroll);
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) play();
}

function prevTrack() {
  currentTrackIndex =
    (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
  if (isPlaying) play();
}

function togglePlay() {
  isPlaying ? pause() : play();
}

function play() {
  audio.play().catch(console.error);
  isPlaying = true;
  playIcon.style.display = "none";
  pauseIcon.style.display = "block";
}

function pause() {
  audio.pause();
  isPlaying = false;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
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
