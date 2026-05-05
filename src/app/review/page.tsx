'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BeatLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { HiOutlineClipboardDocument } from 'react-icons/hi2';
import { HiOutlineClipboardDocumentCheck } from 'react-icons/hi2';
import { useStoreContext } from '../helpers/StoreContext';
import { ButtonDirection } from '@/components/buttons/ButtonDirection';
import { generateResponse } from '@/util/api';
import MarkdownComponent from '@/components/markdown/MarkdownComponent';
import useCopy from '@react-hook/copy';

export default function Review() {
    const { storeValue } = useStoreContext();

    const [combineInputs, setCombineInputs] = useState<string>('');
    const [disabled, setDisabled] = useState<boolean>(true);
    const [geminiResponse, setGeminiResponse] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const result = storeValue.inputValues
            .map((input) => input.question)
            .filter((input) => input.length > 0)
            .join('\n');
        setCombineInputs(result);
    }, [storeValue.inputValues]);

    const handleSubmit = async () => {
        setLoading(true);
        setErrorMessage('');

        try {
            const response = await generateResponse(combineInputs);
            setGeminiResponse(response as string);
        } catch (error) {
            console.warn(error instanceof Error ? error.message : error);
            setGeminiResponse('');
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while generating a response.',
            );
        } finally {
            setLoading(false);
        }
    };

    const { copied, copy } = useCopy(combineInputs);

    return (
        <section className="text-black flex flex-col items-center h-full overflow-y-auto container">
            <section className="flex flex-col mt-[58px] w-full">
                <Link href="/promptInput" className="underline">
                    Back
                </Link>

                <h3 className="mt-8 font-bold mb-2">Preview your prompt</h3>
                <div className="flex flex-col items-start p-2  bg-gray-300  rounded-2xl w-full">
                    <textarea
                        disabled={disabled}
                        className={`w-full h-[200px] rounded-md p-2 ${
                            disabled ? 'text-gray-400' : 'text-black border-1 border-amber-50'
                        }`}
                        value={combineInputs}
                        onChange={(e) => setCombineInputs(e.target.value)}
                    />

                    <div className="w-full justify-between flex ">
                        <div
                            className={`p-2 cursor-pointer  rounded-md mt-2 text-xs content-center ${
                                disabled ? 'bg-gray-400 text-white' : ''
                            }`}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} />

                            <button
                                onClick={() => setDisabled(!disabled)}
                                className="px-1 cursor-pointer "
                            >
                                Edit Prompt
                            </button>
                        </div>
                        <button
                            onClick={copy}
                            className="p-2 cursor-pointer  mr-6 rounded-md mt-2 text-xl bg-gray-400 text-white"
                        >
                            {copied === false ? (
                                <HiOutlineClipboardDocument />
                            ) : (
                                <HiOutlineClipboardDocumentCheck />
                            )}
                        </button>
                    </div>
                </div>
            </section>

            <ButtonDirection active={true} text="Generate Result" onClick={handleSubmit} />

            <div className="w-full flex flex-col my-[62px] ">
                <h3 className="font-bold mb-2">Ember Response</h3>
                <div className="w-full p-4 bg-gray-300  rounded-lg geminiMarkdown min-h-[250px]">
                    {loading ? (
                        <BeatLoader
                            size={12}
                            color="#3498db"
                            loading={loading}
                            speedMultiplier={1}
                            className="mx-auto"
                        />
                    ) : errorMessage ? (
                        <p className="text-red-700">{errorMessage}</p>
                    ) : geminiResponse ? (
                        <MarkdownComponent markdownText={geminiResponse} />
                    ) : (
                        <p> {'Ask your question in the prompt'}</p>
                    )}
                </div>
            </div>
        </section>
    );
}
