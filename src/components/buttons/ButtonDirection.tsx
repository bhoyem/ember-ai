interface ButtonDirectionType {
    text: string;
    active: boolean;
    onClick: () => void | Promise<void>;
}

export function ButtonDirection({ text, active, onClick }: ButtonDirectionType) {
    return (
        <button
            className={`mt-4 flex justify-end   text-white font-bold py-2 px-10 rounded-4xl ${
                active ? 'bg-[#61529D] hover:bg-[#7163aa] cursor-pointer' : 'bg-blue-100'
            }`}
            onClick={onClick}
            disabled={!active}
        >
            {text}
        </button>
    );
}
