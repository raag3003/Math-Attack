# 🎮 Math-Attack

![C#](https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=c-sharp&logoColor=white)
![.Net](https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=.net&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![SignalR](https://img.shields.io/badge/SignalR-%23512BD4.svg?style=for-the-badge&logo=.net&logoColor=white)

> *An interactive math learning game designed to make math fun and challenging for students in grades 4-10*

## 🌟 Main features

- 🏰 Fantasy-inspired city with various learning areas for students
- ⚔️ Realtime-multiplayer math duels
- 📚 Comprehensive collection of formulas and flashcards
- 📊 Various levels of difficulty adapted to the student's grade level
- 🎯 Instant feedback on quetions
- 🔄 Rematch-system to keep students playing for longer

## ℹ️ Overview

Math-Attack is a web-based learning game that gamificate old boring math to create an engaging learning experience for students. The game is built with ASP.NET Core and uses SignalR for real-time communication between players. It features both solo learning through "Den Sorte Skole" and competitive learning through "Kamppladsen".

## 🎮 Gameplay

**Kampplads:**
```csharp
// Real-time math duels for players to compete against each other
// Automatic matchmaking based on the choosen grade level (The grade level system is designed based on the danish school system)
// Dynamic damage-system that work by answering a quetion correct to do damage on your opponent
```

**Den Sorte Skole:**
```csharp
// Comprehensive collection of formulas
// Interactive flashcards
// Practice questions with instant feedback (Correct or incorrect)
```

## ⚙️ Installation

1. Make sure to have the following installed:
   - .NET 6.0 or newer
   - SQL Server (LocalDB or the standard MSSQL)
   - Node.js

2. Klon the project from github:
```bash
git clone https://github.com/yourUsername/math-attack.git
cd math-attack
```

3. Make sure all NuGet-packages is installed and working, before building the project:
```bash
dotnet restore
dotnet build
```

4. Run database migration (for the login system):
```bash
dotnet ef database update
```

5. Start the application:
```bash
dotnet run
```

When all the steps above is done run IIS Express in Visual Studio or another IDE of your choice.

## 🔧 Technical Requirements

- .NET 6.0+
- MSSQL Server
- A modern web browser (Chrome, Edge, Firefox etc.)
- A stable internet connection
