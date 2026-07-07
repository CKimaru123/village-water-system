import React, { useState, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  TextField, IconButton, Avatar, LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import SendIcon from "@mui/icons-material/Send";
import TranslateIcon from "@mui/icons-material/Translate";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: <MicIcon />, title: "Voice Commands", desc: "Admins can use voice commands to query dashboards, generate reports, and trigger workflows hands-free." },
  { icon: <TranslateIcon />, title: "Multilingual Support", desc: "Voice assistant supports Swahili, English, and local dialects for inclusive community engagement." },
  { icon: <SupportAgentIcon />, title: "Client Self-Service", desc: "Clients can check their bill, report issues, and get usage tips via voice IVR without needing the app." },
  { icon: <NotificationsActiveIcon />, title: "Voice Alerts", desc: "Critical alerts like water outages or overdue bills can be delivered as automated voice calls." },
];

const VoiceAssistantIntegration = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  const addMessage = (role, text) => {
    setMessages(prev => {
      const updated = [...prev, { role, text, time: new Date().toLocaleTimeString() }];
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      return updated;
    });
  };

  const processCommand = (text) => {
    const t = text.toLowerCase();
    if (t.includes("anomal"))           { addMessage("assistant", "Opening AI Anomaly Detection..."); setTimeout(() => navigate("../ai-anomalies"), 700); }
    else if (t.includes("incident"))    { addMessage("assistant", "Opening Incident Management..."); setTimeout(() => navigate("../incidents"), 700); }
    else if (t.includes("maintenance")) { addMessage("assistant", "Opening Predictive Maintenance..."); setTimeout(() => navigate("../predictive-maintenance"), 700); }
    else if (t.includes("report"))      { addMessage("assistant", "Opening Financial Reports..."); setTimeout(() => navigate("../financial-reports"), 700); }
    else if (t.includes("scada"))       { addMessage("assistant", "Opening SCADA Integration..."); setTimeout(() => navigate("../scada"), 700); }
    else if (t.includes("overdue") || t.includes("dunning")) { addMessage("assistant", "Opening Dunning Workflow..."); setTimeout(() => navigate("../dunning"), 700); }
    else if (t.includes("segment"))     { addMessage("assistant", "Opening AI Segmentation..."); setTimeout(() => navigate("../ai-segmentation"), 700); }
    else if (t.includes("blockchain") || t.includes("ledger")) { addMessage("assistant", "Opening Blockchain Ledger..."); setTimeout(() => navigate("../blockchain-ledger"), 700); }
    else { addMessage("assistant", `I heard: "${text}". Try saying: anomalies, incidents, maintenance, reports, SCADA, dunning, segmentation, or blockchain.`); }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addMessage("assistant", "⚠️ Speech recognition requires Chrome or Edge browser.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e) => {
      // Show interim results live in the input box
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      // Put whatever we have into the text field so user can see it
      setInputText(final || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      // After recognition ends, whatever is in the input box is the final transcript.
      // The user can edit it and press Send, or it auto-sends if there's content.
      setInputText(prev => {
        if (prev.trim()) {
          // auto-add to chat and process
          addMessage("user", prev.trim());
          processCommand(prev.trim());
          return "";
        }
        return prev;
      });
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === "no-speech") {
        addMessage("assistant", "No speech detected. Please try again.");
      } else if (e.error === "network") {
        addMessage("assistant", "⚠️ Network error: Chrome's speech recognition requires an internet connection to Google's servers. Please check your connection and try again.");
      } else if (e.error !== "aborted") {
        addMessage("assistant", `Speech error: ${e.error}. Please try again.`);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    addMessage("user", inputText.trim());
    processCommand(inputText.trim());
    setInputText("");
  };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">
        Voice Assistant Integration
      </Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">
        Hands-free system interaction and client IVR
      </Typography>

      {/* Feature overview cards — original content */}
      <Grid container spacing={2} mb={3}>
        {features.map((f, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Box sx={{ color: colors.greenAccent[400] }}>{f.icon}</Box>
                  <Typography variant="h5" color={colors.grey[100]}>{f.title}</Typography>
                </Box>
                <Typography variant="body2" color={colors.grey[300]}>{f.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Voice command console */}
      <Card sx={{ backgroundColor: colors.primary[400] }}>
        <CardContent>
          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb={2}>
            Voice Command Console
          </Typography>

          {/* Chat area */}
          <Box sx={{
            height: 300, overflowY: "auto", backgroundColor: colors.primary[500],
            borderRadius: 2, p: 2, mb: 2,
          }}>
            {messages.length === 0 && (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
                height="100%" gap={1}>
                <SmartToyIcon sx={{ fontSize: 40, color: colors.blueAccent[400], opacity: 0.5 }} />
                <Typography color={colors.grey[500]} textAlign="center" variant="body2">
                  Click the mic and speak, or type a command below.<br />
                  Try: "Show anomalies", "Open incidents", "Check SCADA"
                </Typography>
              </Box>
            )}
            {messages.map((m, i) => (
              <Box key={i} display="flex"
                justifyContent={m.role === "user" ? "flex-end" : "flex-start"} mb={1.5}>
                <Box display="flex" alignItems="flex-start" gap={1} maxWidth="80%"
                  flexDirection={m.role === "user" ? "row-reverse" : "row"}>
                  <Avatar sx={{
                    width: 28, height: 28,
                    backgroundColor: m.role === "user" ? colors.blueAccent[700] : colors.greenAccent[700],
                  }}>
                    {m.role === "user"
                      ? <PersonIcon sx={{ fontSize: 16 }} />
                      : <SmartToyIcon sx={{ fontSize: 16 }} />}
                  </Avatar>
                  <Box sx={{
                    backgroundColor: m.role === "user" ? colors.blueAccent[800] : colors.primary[400],
                    borderRadius: 2, p: "8px 12px",
                  }}>
                    <Typography variant="body2" color={colors.grey[100]}>{m.text}</Typography>
                    <Typography variant="caption" color={colors.grey[600]}>{m.time}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>

          {/* Listening indicator */}
          {isListening && (
            <Box mb={1}>
              <LinearProgress sx={{ "& .MuiLinearProgress-bar": { backgroundColor: colors.redAccent[400] } }} />
              <Typography variant="caption" color={colors.redAccent[400]}>
                ● Listening... speak now
              </Typography>
            </Box>
          )}

          {/* Input row */}
          <Box component="form" onSubmit={handleSend} display="flex" gap={1} alignItems="center">
            <TextField
              size="small" fullWidth
              placeholder={isListening ? "Listening..." : "Type a command or click the mic..."}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isListening}
            />
            <Button type="submit" variant="contained" disabled={!inputText.trim() || isListening}
              sx={{ backgroundColor: colors.blueAccent[700], minWidth: 40, px: 1.5 }}>
              <SendIcon fontSize="small" />
            </Button>
            <IconButton
              onClick={isListening ? stopListening : startListening}
              sx={{
                backgroundColor: isListening ? colors.redAccent[700] : colors.greenAccent[700],
                color: "#fff", width: 40, height: 40,
                "&:hover": {
                  backgroundColor: isListening ? colors.redAccent[600] : colors.greenAccent[600],
                },
              }}>
              {isListening ? <StopIcon /> : <MicIcon />}
            </IconButton>
          </Box>

          <Typography variant="caption" color={colors.grey[500]} mt={1} display="block">
            Commands: anomalies · incidents · maintenance · reports · SCADA · dunning · segmentation · blockchain
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VoiceAssistantIntegration;
