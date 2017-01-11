ws_ws
=====

An intro to web sockets.


Running Tests
-------------

We continue to use QUnit to define tests that you should attempt to complete.  
The automated tests are with `npm` on the command line; part of the task is to
create a web page that you'll have to test by looking if it's doing the right
thing.

The usual steps to install the source code and the test framework and then run
the tests from the command line:

1. To download the code, either use git (the simplest option):

  ```bash
  git clone https://github.com/portsoc/ws_ws.git
  cd ws_ws
  ```
  or download and unpack the [zip](https://github.com/portsoc/ws_ws/archive/master.zip)
  which on linux can be achieved using
  ```bash
  wget https://github.com/portsoc/ws_ws/archive/master.zip
  ```
  then
  ```bash
  unzip master.zip
  cd ws_ws-master
  ```

2. To download the QUnit files (and any libraries it uses, which you need to do before the first run of tests, but just the once) type:

  ```bash
  npm install
  ```

3. Run the tests by typing:

  ```bash
  npm test
  ```

4. **Inside `test.js` you will find helpful comments that tell you what the tests expect.**


5. The file `test.html` contains a client-side simple test that your server is sending messages. To use it, open `test.html` in your browser, or copy `test.html` and `assess.ws.js` into `worksheet/webpages` and then go to http://your-ip/test.html


Git: A recommendation
----------------------
If at all possible, we recommend you use git to download code rather than zips
of a repository.  This is preferable because if the repo is updated, then
syncing those changes requires just one command (`git pull`) and usually any
merging can be done automatically.  Git is very powerful and we heartily
encourages you to become familiar with it.
