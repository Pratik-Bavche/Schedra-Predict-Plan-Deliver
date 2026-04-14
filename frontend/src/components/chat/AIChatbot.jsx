import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hello! I'm Schedra AI. How can I help you with your project forecasts today?" }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isTyping])

    const generateResponse = (query) => {
        const lowerQuery = query.toLowerCase()

        if (lowerQuery.includes("loss") || lowerQuery.includes("risk") || lowerQuery.includes("avoid")) {
            return "To mitigate potential losses, I recommend reviewing the supplier contracts for the 'Steel' category. Also, enabling 'Rain Delay' insurance could save approx $12k based on the upcoming monsoon forecast."
        }
        if (lowerQuery.includes("delay") || lowerQuery.includes("time") || lowerQuery.includes("schedule")) {
            return "Based on historical data, monsoon season might delay the foundation work by 4 days. I suggest buffering the timeline by 1 week."
        }
        if (lowerQuery.includes("cost") || lowerQuery.includes("budget") || lowerQuery.includes("price")) {
            return "I've detected a 15% cost variance in the steel procurement for Tower #45. You might want to re-negotiate with Vendor B."
        }
        if (lowerQuery.includes("hello") || lowerQuery.includes("hi")) {
            return "Hello! I'm here to help you optimize your project. Ask me about risks, costs, or delays."
        }

        return "I'm analyzing the latest project data... Could you specify if you are interested in Risks, Schedule, or Costs?"
    }

    const handleSend = () => {
        if (!inputValue.trim()) return

        const userMsg = { role: "user", content: inputValue }
        setMessages((prev) => [...prev, userMsg])
        const userQuery = inputValue
        setInputValue("")
        setIsTyping(true)

        // Mock AI Response
        setTimeout(() => {
            const response = generateResponse(userQuery)
            setMessages((prev) => [...prev, { role: "assistant", content: response }])
            setIsTyping(false)
        }, 1000)
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend()
    }

    return (
        <>
            {/* Floating Toggle Button */}
            <Button
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-50",
                    isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
                )}
                size="icon"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="h-7 w-7" />
            </Button>

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ease-in-out origin-bottom-right",
                isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
            )}>
                <Card className="w-screen sm:w-[400px] h-[100dvh] sm:h-[500px] flex flex-col shadow-2xl border-primary/20 sm:rounded-lg rounded-none pb-safe">
                    <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-primary-foreground rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <CardTitle className="text-base">Schedra Assistant</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full p-4">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex gap-2 max-w-[85%]",
                                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}>
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-lg px-3 py-2 text-sm",
                                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-2 mr-auto max-w-[85%]">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 border-t bg-muted/20">
                        <div className="flex w-full items-center gap-2">
                            <Input
                                placeholder="Ask about project risks..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="flex-1"
                            />
                            <Button size="icon" onClick={handleSend} disabled={!inputValue.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}
