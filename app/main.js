const net = require("net");
const path1 = require("path");
const fs = require("fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const content = data.toString();
    const requestLines = content.split("\r\n");
    const startLineParts = requestLines[0].split(" ");
    const method = startLineParts[0].toUpperCase();
    const path = startLineParts[1];
    
    let httpResponse;
    
    const args = process.argv;
    let dirPath = "";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--directory" && args[i + 1]) {
        dirPath = args[i + 1];
        break;
      }
    }
    
    if (path === "/") {
      httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
      socket.write(httpResponse);
      socket.end();
    } else if (path.includes("/echo/")) {
      const pathParts = path.split("echo/");
      const randomStr = pathParts[1];
      httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-length: ${randomStr.length}\r\n\r\n${randomStr}`;
      socket.write(httpResponse);
      socket.end();
    } else if (path.includes("user-agent")) {
      const userAgentParts = requestLines[2].split(" ");
      const userAgent = userAgentParts[1];
      httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-length: ${userAgent.length}\r\n\r\n${userAgent}`;
      socket.write(httpResponse);
      socket.end();
    } else if (path.includes("/files/")) {
      const fileName = path.split("files/")[1];
      const filePath = path1.join(dirPath, fileName);
      console.log(filePath);
      
      if (method === "POST") {
        const requestBody = requestLines[requestLines.length - 1];
        fs.writeFile(filePath, requestBody, (err) => {
          if (err) {
            console.error(`Error writing the file ${filePath}:`, err);
            httpResponse = "HTTP/1.1 500 Internal Server Error\r\n\r\n";
          } else {
            httpResponse = "HTTP/1.1 201 Created\r\n\r\n";
          }

          socket.write(httpResponse);
          socket.end();
        });
      }
      
      fs.readFile(filePath, (err, file) => {
        if (err) {
          console.error(`Error reading file ${filePath}:`, err);
          httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
        } else {
          httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length}\r\n\r\n`;
          // Append the file content to the response
          httpResponse += file;
        }
    
        // Write the response and close the connection
        socket.write(httpResponse);
        socket.end();
      });
    } else {
      httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
      socket.write(httpResponse);
      socket.end();
    }
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
