FROM node:8.12.0

# Grab google chrome from repository
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list

# Install Google Chrome (change to <google-chrome-latest> or <google-chrome-beta> if needed)
RUN apt -y install google-chrome-stable

# Install chromedriver
RUN wget https://chromedriver.storage.googleapis.com/2.45/chromedriver_linux64.zip
RUN unzip chromedriver_linux64.zip
RUN rm chromedriver_linux64.zip
RUN mv chromedriver /usr/bin/chromedriver