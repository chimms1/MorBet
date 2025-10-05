# MorBet
A buggy and vulnerable web application containing XSS, SQL injection, OS command injection and more.

# How to use?

## Requirements
* Docker

1. Clone the repo
    ```sh
    git clone https://github.com/chimms1/MorBet.git
    ```
2. From top of the repo directory, run
   * Build images and start containers (first run will initialize DB from SQL file):
    ```sh
    docker-compose up --build
    ```
    * To remove everything (containers + network, leaving persistent DB data):
    ```sh
    docker-compose down
    ```
    * volumes remain; to drop data:
    ```sh
    docker-compose down -v
    ```
3. Wait until all containers start, backend may restart until DB starts. Wait until backend start.Then access:
    
    * [http://localhost:3000](http://localhost:3000)

# About the Application

### Backend (vuln_backend)
The backend is a deliberately vulnerable **Node.js + Express** application connected to a MySQL database.  
It implements core user functionality such as registration, login, wallet management, withdrawals, and a public comment section.

#### Features:
- User registration and authentication (session handled via cookies)
- Add funds and withdraw from wallet
- Change password
- Public comment system
- Proxy endpoint to request user images from the GameServer

#### Known Vulnerabilities:
| Type | Location | Description |
|------|-----------|-------------|
| **SQL Injection** | `/login` | Direct concatenation of user input into SQL queries without sanitization. |
| **Stored XSS** | `/comment` | User input stored in the database and rendered as HTML, allowing script injection. |
| **Command Injection** | `/withdraw` | Unsanitized `command` query parameter passed directly to `exec()`. |
| **CSRF** | All forms (especially `/changepassword` and `/withdraw`) | No CSRF protection, allowing cross-site form submissions. |
| **Insecure Authentication** | Cookie-based session tracking without validation or expiration. 

---

### GameServer (gameserver)
The GameServer is a **secondary Node.js microservice** that serves user images dynamically based on the `userType` cookie.  
It exposes endpoints that the main backend queries internally.

#### Purpose:
- Demonstrates **Server-Side Request Forgery (SSRF)** by allowing the backend (`/userImage`) to make requests to the GameServer.

---

### 💡 Frontend (Static Pages)
The frontend consists of several static **HTML pages** styled with Bootstrap, served from the `frontend/` directory.  
Each page demonstrates typical web app features — intentionally insecure where relevant.

| Page | Description | 
|------|--------------|
| **login.html** | Login form submitting credentials to `/login`.|
| **register.html** | Registers a new user into the system. | 
| **dashboard.html** | Main user dashboard showing wallet balance and a public comment feed. | 
| **addfunds.html** | Allows adding funds to wallet. | 
| **withdraw.html** | Allows withdrawing funds and executes OS commands. | 
| **changepassword.html** | Changes password via POST. | 
| **public comments** | Displays all user comments |

---

###  Educational Purpose
Insecure application, use at own risk
