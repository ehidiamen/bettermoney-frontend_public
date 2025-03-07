"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { collection, addDoc, query, where, orderBy, onSnapshot } 
from "firebase/firestore";
import { db } from "../firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic } from "lucide-react";
import Navbar from "../components/Navbar";

import BottomNav from "../components/BottomNav";

export default function Page() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!currentUser) {
            router.push("/login");
            return;
        }

        const messagesRef = collection(db, "messages");
        const q = query(messagesRef, where("userId", "==", currentUser.uid), orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messagesData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, [currentUser, router]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        await addDoc(collection(db, "messages"), {
            userId: currentUser.uid,
            text: newMessage,
            createdAt: new Date(),
        });
        setNewMessage("");
    };

    const handleSpeech = () => {
        if (!recognitionRef.current) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Speech recognition is not supported in this browser.");
                return;
            }
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = "en-US";

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setNewMessage(transcript);
            };

            recognitionRef.current.onend = () => setIsListening(false);
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <div className="flex flex-col h-screen p-4">
            {/* Navbar */}
            <Navbar />
    
            <ScrollArea className="flex-1 overflow-y-auto border rounded p-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-2 p-2 border rounded">
                        {msg.text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </ScrollArea>
    
            {/* Adjusted Input Section with More Bottom Margin */}
            <div className="flex items-center gap-2 mt-2 mb-16">
                <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                />
                <Button onClick={handleSpeech} variant={isListening ? "destructive" : "default"}>
                    <Mic />
                </Button>
                <Button onClick={sendMessage}>
                    <Send />
                </Button>
            </div>
    
            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
    
}
