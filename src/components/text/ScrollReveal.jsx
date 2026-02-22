export default function ScrollReveal({ text }) {
    return (
        <div className="my-8 p-6 bg-gray-900/50 rounded-lg border-l-4 border-blue-500">
            <p className="text-xl md:text-2xl text-gray-200 font-medium leading-relaxed">
                {text}
            </p>
        </div>
    );
}
