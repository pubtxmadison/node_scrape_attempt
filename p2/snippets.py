#
#You probably didn't need this, but this is what I used to inject the "doHL" (doHeadline or doHighlight, who knows) script, which takes the title and either tries to highlight it if it finds an exact match, or highlights the individual words if no match was found.  
#
  try {
    var data = fs.readFileSync('jquery-3.2.1.min.js', 'utf8');
    await page.addScriptTag({ content: data});
  } catch(e) {
    console.log('Error:', e.stack);
  }

  //await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'});
  try {
      var data = fs.readFileSync('doHL.js', 'utf8');
      const dataString = data.replace("replaceMeTitle", title);
      await page.addScriptTag({ content: dataString});
  } catch(e) {
      console.log('Error:', e.stack);
  }
  
  
#
#The rest of these are snippets from a python script, I am sure mostly useless to you, except to see what the original idea/goal was.
#
#First up, finding the canonical URL, this is passed to a database - as long as you put it into a variable (cURL for canonical URL) that's fine.  
#
#
  
self.trueURL = ""
        # look for:
        # * link rel=canonical href=
        canonicalURL = soup.find_all("link", rel="canonical")

        # * meta property=og:url content=
        ogURL = soup.find_all("meta", property="og:url")

        # * meta name=twitter:url content=
        twtURL = soup.find_all("meta", "name=twitter:url")

        if len(canonicalURL) > 0:
            self.trueURL = canonicalURL[0].get('href')
            logging.warning(f"Found CANONICAL url {canonicalURL[0].get('href')}")
            if self.trueURL == None:
                self.trueURL = self.post['rURL']
                logging.warning(f"CANONICAL url blank, using rURL {self.post['rURL']}")
        elif len(ogURL) > 0:
            self.trueURL = ogURL[0].get('content')
            logging.warning("Found OG url")
        elif len(twtURL) > 0:
            self.trueURL = twtURL[0].get('content')
            logging.warning("Found TWITTER url")
        else:
            # ...if none found, use original url
            self.trueURL = self.post['rURL']
            logging.warning("No URLs found, using original")

        #sometimes canonical URL exists but is empty, so fall back to submission URL
        if self.trueURL == "":
          self.trueURL = self.post['rURL']
          logging.warning(f"CANONICAL url blank, using rURL {self.post['rURL']}")
        
        
        if self.trueURL == None:
          logging.warning("!!! Problem getting url with thing id: " + self.post['rID'])
          self.addURL(self.post['rID'],subCreated_utc,"","","")
          return True


        #sometimes canonical URL exists but is empty, so fall back to submission URL
        if self.trueURL == "":
          self.trueURL = subUrl

        if self.trueURL == None:
          logging.warning("!!! Problem getting url with thing id: " + subID)
          self.addURL()
          
          
#
# Next up, we try to get rid of anything that isn't actually part of the URL, stuff after #'s or ?'s
# this is an awful way to do this, I am sure you can come up with a better way than listing the exceptions where these are wrong.
# This is also currently called "trueURL" in this script, but would be "mURL" for modified URL
# 
        theURL = self.trueURL
        theURLa = ""
    
        x = "c-span.org/video/?"
        if (theURL.find(x) > 0):
            splitLoc = theURL.find(x)+len(x)
            theURLa = theURL[:splitLoc]
            theURL = theURL[splitLoc:]

        x = "poll.qu.edu/poll-release?"
        if (theURL.find(x) > 0):
            splitLoc = theURL.find(x)+len(x)
            theURLa = theURL[:splitLoc]
            theURL = theURL[splitLoc:]

        x = "senate.gov/?"
        if (theURL.find(x) > 0):
            splitLoc = theURL.find(x)+len(x)
            theURLa = theURL[:splitLoc]
            theURL = theURL[splitLoc:]

        x = "youtube.com/watch?"
        if (theURL.find(x) > 0):
            splitLoc = theURL.find(x)+len(x)
            theURLa = theURL[:splitLoc]
            theURL = theURL[splitLoc:]

        x = "latimes.com/infinity/article_share.aspx?"
        if (theURL.find(x) > 0):
            splitLoc = theURL.find(x)+len(x)
            theURLa = theURL[:splitLoc]
            theURL = theURL[splitLoc:]

        x = "house.gov/news/documentsingle.aspx?"
        if (theURL.find(x) > 0):
            splitLoc = theURL.find(x)+len(x)
            theURLa = theURL[:splitLoc]
            theURL = theURL[splitLoc:]

        tInd = 0;
        if(theURL.find("&") > 0):
            tInd = theURL.find("&")
            if(theURL.find("?") > 0 and theURL.find("?") < tInd):
                tInd = theURL.find("?")
            if(theURL.find("#") > 0 and theURL.find("#") < tInd):
                tInd = theURL.find("#")
        elif(theURL.find("?") > 0):
            tInd = theURL.find("?")
            if(theURL.find("&") > 0 and theURL.find("&") < tInd):
                tInd = theURL.find("&")
            if(theURL.find("#") > 0 and theURL.find("#") < tInd):
                tInd = theURL.find("#")
        elif(theURL.find("#") > 0):
            tInd = theURL.find("#")
            if(theURL.find("?") > 0 and theURL.find("?") < tInd):
                tInd = theURL.find("?")
            if(theURL.find("&") > 0 and theURL.find("&") < tInd):
                tInd = theURL.find("&")
        if(tInd>0):
            theURL = theURL[:tInd]
        if theURLa:
            theURL = theURLa + theURL
            theURLa = ""
            
            
#
# Finally, I misremembered - I thought we had some existing logic to find the headline, it's actually to find the published date, any way you can think of to improve this
# or to make some fallback logic for if these specific conditions aren't met, importantly this is not an updated date but the date the article was originally published.
# I'd also like you to take a shot at making something similar to try to pull the headline (not the Title), we can discuss further for clarification if need be. 
# if it has to be a similar approach with specific logic for sites, that's okay - try to make a few, but some fallback logic for an attempt if nothing is specified for 
# that particular domain would be awesome. 
# 

soup = BeautifulSoup(self.pageHTML, "html.parser")
        dateFound = False
        timestamp = None
        rID = self.scrapeResults['rID']
        rURL = self.scrapeResults['rURL']
        #doLog("Detecting post publish date for " + str(rid) + ", " + rURL)

        while True:
            # try 'datePublished' property, used by ibtimes, cnn, amongst many others
            # could be <meta>, could be something else
            datePublished = soup.find(attrs={"itemprop": "datePublished"})
            if  hasattr(datePublished,'attrs') and 'datetime' in datePublished.attrs and timestamp == None:
                dateFound = True
                #datePublished['datetime']
                timestamp = datePublished['datetime']

                # convert iso timestamp to python time tuple
                # md = dateutil.parser.parse(z)

                # now convert to javascript timestamp
                # t.mktime(md.timetuple()) * 1000

            if hasattr(datePublished, 'attrs') and 'content' in datePublished.attrs and timestamp == None:
                dateFound = True
                timestamp = datePublished['content']
                # timestamp in content might not be parsable, so try to parse.. if it fails, let's try the contents
                try:
                    pyDate = dateutil.parser.parse(timestamp)
                    jsDate = time.mktime(pyDate.timetuple()) * 1000
                except:
                    timestamp = datePublished.text

            # AP: <span class='updated' title='(date)'>
            datePublished = soup.find('span', attrs={"class":"updated"})
            if hasattr(datePublished,'attrs') and 'title' in datePublished.attrs and timestamp == None:
                dateFound = True
                timestamp = datePublished['title']

            # cbslocal / wordpress installs
            datePublished = soup.find('em', attrs={'entry-date'})
            if datePublished != None and timestamp == None:
                dateFound = True
                timestamp = datePublished.text

            # theHill and others
            datePublished = soup.find('meta', attrs={"property": "article:published_time"})
            if hasattr(datePublished, 'attrs') and 'content' in datePublished.attrs and timestamp == None:
                dateFound = True
                # datePublished['datetime']
                timestamp = datePublished['content']

            # salon
            datePublished = soup.find('span', attrs={"class": "toLocalTime"})
            if hasattr(datePublished, 'attrs') and 'data-tlt-epoch-time' in datePublished.attrs and timestamp == None:
                dateFound = True
                timestamp = datePublished['data-tlt-epoch-time']
                # even though we ultimately convert to epoch time, we're expecting a date string, so
                # create a date string for later in the script
                timestamp = datetime.datetime.fromtimestamp(int(timestamp)).strftime('%c')

            # wash examiner
            datePublished = soup.find('span', attrs={'class': 'pubdate'})
            if datePublished != None and timestamp == None:
                dateFound = True
                timestamp = datePublished.text

            # reuters
            datePublished = soup.find('span', attrs={'class': 'timestamp'})
            if datePublished != None and timestamp == None:
                #print('reuters')
                dateFound = True
                timestamp = datePublished.text

            # politico
            datePublished = soup.find('p', attrs={"class": "timestamp"})
            if datePublished and timestamp == None:
                datePublished = datePublished.find('time')
                #print(datePublished)
                if hasattr(datePublished, 'attrs') and 'datetime' in datePublished.attrs:
                    #print('politico!')
                    dateFound = True
                    timestamp = datePublished['datetime']

            # bbc
            datePublished = soup.find('div', attrs={"class": "date"})
            if hasattr(datePublished, 'attrs') and 'data-seconds' in datePublished.attrs and timestamp == None:
                #print('bbc!')
                dateFound = True
                timestamp = datePublished['data-seconds']
                # even though we ultimately convert to epoch time, we're expecting a date string, so
                # create a date string for later in the script
                timestamp = datetime.datetime.fromtimestamp(int(timestamp)).strftime('%c')

            # bloomberg
            datePublished = soup.find('time', attrs={"datetime"})
            if hasattr(datePublished, 'attrs') and 'datetime' in datePublished.attrs and timestamp == None:
                #print('bloomberg')
                dateFound = True
                timestamp = datePublished['datetime']

            # newsobserver.com
            datePublished = soup.find('p', attrs={'class': 'published-date'})
            if datePublished != None and timestamp == None:
                #print('newsobserver')
                dateFound = True
                timestamp = datePublished.text

            #slate
            datePublished = soup.find_all('time', attrs={'itemprop':'datePublished'})
            if len(datePublished) > 0 and timestamp == None and 'content' in datePublished:
                #print('slate')
                datePublished = datePublished[0]
                dateFound = True
                timestamp = datePublished['content']

            # aljazeera
            datePublished = soup.find_all('time')
            if len(datePublished) > 0 and hasattr(datePublished, 'datetime') and timestamp == None:
                #print('aljazeera')
                #print(datePublished)
                datePublished = datePublished[0]
                dateFound = True
                timestamp = datePublished['datetime'].replace(u'\xa0', ' ')

            # MSNBC video page
            datePublished = soup.find('meta', attrs={"itemprop": "uploadDate"})
            if hasattr(datePublished, 'attrs') and 'content' in datePublished.attrs and timestamp == None:
                dateFound = True
                # datePublished['datetime']
                timestamp = datePublished['content']

            # whitehouse.gov
            datePublished = soup.find('span', attrs={'class': 'share-date'})
            if datePublished != None and timestamp == None:
                #print('whitehouse.gov')
                dateFound = True
                timestamp = datePublished.text

            # also whitehouse.gov (plus many others, uses article:published_time
            datePublished = soup.find('meta', attrs={"article:published_time"})
            if hasattr(datePublished, 'attrs') and 'content' in datePublished.attrs and timestamp == None:
                dateFound = True
                timestamp = datePublished['content']

            # dailycaller.com
            datePublished = soup.find('div', attrs={'class': 'dateline'})
            if datePublished != None and timestamp == None:
                #print('dailycaller')
                dateFound = True
                timestamp = datePublished.text

            # commondreams.org
            datePublished = soup.find('span', attrs={'class': 'date-display-single'})
            if datePublished != None and timestamp == None:
                #print('commondreams')
                dateFound = True
                timestamp = datePublished.text

            # sfgate.com
            datePublished = soup.find('h5', attrs={'class': 'timestamp'})
            if datePublished != None and timestamp == None:
                #print('sfgate')
                dateFound = True
                timestamp = datePublished['title']

            # judicialwatch.com
            datePublished = soup.find('p', attrs={'class': 'cwdate'})
            if datePublished != None and timestamp == None:
                #print('judicialwatch')
                dateFound = True
                timestamp = datePublished.text

            # theintercept.com
            datePublished = soup.find('span', attrs={'class': 'PostByline-date'})
            if datePublished != None and timestamp == None:
                #print('theintercept')
                dateFound = True
                timestamp = datePublished.text

            # nothing matched, so quit
            break


        if dateFound:
            logging.info("Timestamp found for rID: " + str(rID) + ": " + str(timestamp))

            try:
                pyDate = dateutil.parser.parse(timestamp)
                jsDate = time.mktime(pyDate.timetuple())  # *1000
                timestamp = int(jsDate)
            except:
                timestamp = None
            logging.info("timestamp: " + str(timestamp))
