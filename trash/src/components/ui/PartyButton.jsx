import confetti from 'canvas-confetti';

export default function PartyButton({ text = "Launch Rocket 🚀", onClick }) {
    const fire = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            origin: { x, y },
            particleCount: 150,
            spread: 60,
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });

        if (onClick) onClick(e);
    };

    return (
        <button
            onClick={fire}
            className="px-8 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 active:scale-95 transition-transform shadow-xl"
        >
            {text}
        </button>
    );
}
