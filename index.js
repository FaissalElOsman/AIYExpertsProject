const request = require('request');
const cookie = require('cookie');
const cheerio = require('cheerio');

const loginParams = {
  'form_type': 'customer_login',
  'utf8': '✓',
  'customer[email]': 'faissal.elosman@gmail.com',
  'customer[password]': 'Rainbow.4U'
};

const keywords = ['shirt'];
const size = 'x-large'; // small

var cookieRequest = {
  '__cfduid': 'd05439e01a0dcb76a9b805dc74ae116bd1560713531',
  '_shopify_y': '699c4b2e-f641-4997-89a6-b9cc54e1f3f1',
  'cart_currency': 'GBP',
  '_orig_referrer': '',
  '_landing_page': '/',
  '_y': '699c4b2e-f641-4997-89a6-b9cc54e1f3f1',
  '_shopify_fs': '2019-06-16T19:32:12.868Z',
  '_ga': 'GA1.2.40711068.1560713533',
  '_fbp': 'fb.1.1560713533966.887985112',
  'ba-pr-id': '',
  'boldCurrencyCookie': 'EUR',
  'cart': '033a929c31b7a2702f8bf7a490a96fc1',
  'cookieconsent_status': 'dismiss',
  '_shopify_ga': '2.127401485.1452624498.1561489762-40711068.1560713533',
  '_shopify_country': 'France',
  'cart_sig': '',
  'cart_ts': '1561271175',
  '_shopify_sa_p': '',
  '_gid': 'GA1.2.1452624498.1561489762',
  'boldmc-localized': 'true',
  'boldmc-initial-conversion': 'true',
  '_shopify_s': '6e268ed5-B433-47C8-9F66-230B59DE2FD9',
  '_s': '6e268ed5-B433-47C8-9F66-230B59DE2FD9',
  '_gat': '1',
  '_secure_session_id': '43864c842e4c78c44aaf55bdd85fdc6a',
  'secure_customer_sig': 'deee7924bd6368660e361751400200f4',
  'cf-app-selected-filters': '[]',
  '_shopify_sa_t': '2019-06-25T19:18:10.796Z'
};

function getAsUriParameters (data, sepChar) {
  let url = '';
  for (var prop in data) {
    url += encodeURIComponent(prop) + '=' + encodeURIComponent(data[prop]) + sepChar;
  }
  return url.substring(0, url.length - 1);
}

function handleCookie (receivedCookie) {
  let jsonCookie = {};
  for (let cookieElement = 0; cookieElement < receivedCookie.length; cookieElement++) {
    let parsedCookie = cookie.parse(receivedCookie[cookieElement]);
    for (let key in parsedCookie) {
      if (parsedCookie.hasOwnProperty(key)) {
        jsonCookie[key] = parsedCookie[key];
        cookieRequest[key] = jsonCookie[key];
        break;
      }
    }
  }
}

function getArticleLink (articleNameKeywords) {
  return new Promise(function (resolve, reject) {
    let requestConfig = {
      url: 'https://www.hanon-shop.com/search',
      qs: {
        q: articleNameKeywords.join('+'),
        type: 'product'
      }
    };
    request(requestConfig, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        const $ = cheerio.load(body);
        resolve($('#MainContent > div:nth-child(2) > div.collection-product-grid > div > div:nth-child(1) > div.product-caption > h2 > a:nth-child(2)').attr('href'));
      }
    });
  });
}

function getArticleId (articleLink, size) {
  return new Promise(function (resolve, reject) {
    let requestConfig = {
      url: 'https://www.hanon-shop.com/' + articleLink,
      headers:
      {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
      }
    };
    request(requestConfig, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        const $ = cheerio.load(body);
        $('#product-select option').each(function (i, elm) {
          if ($(this).text().replace(/\t|\n/g, '').toLowerCase() === size.toLowerCase()) {
            resolve($(this).attr('value'));
          }
        });
        resolve('Not found');
      }
    });
  });
}

function login (loginParams) {
  return new Promise(function (resolve, reject) {
    cookieRequest['_shopify_sa_t'] = new Date().toISOString();
    let requestConfig = {
      method: 'POST',
      url: 'https://www.hanon-shop.com/account/login',
      headers:
      {
        'cookie': getAsUriParameters(cookieRequest, '; ')
      },
      formData: loginParams
    };
    request(requestConfig, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        handleCookie(response.headers['set-cookie']);
        resolve(true);
      }
    });
  });
}

function addToCart (idOfArticle) {
  return new Promise(function (resolve, reject) {
    cookieRequest['_shopify_sa_t'] = new Date().toISOString();
    let requestConfig = {
      method: 'POST',
      url: 'https://www.hanon-shop.com/cart/add.js',
      headers:
      {
        'cookie': getAsUriParameters(cookieRequest, '; '),
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
      },
      formData:
      {
        id: idOfArticle
      }
    };
    request(requestConfig, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(response.statusCode);
        console.log(body);
        resolve(true);
      }
    });
  });
}

var context = {
  'linkOfTheArticle': '',
  'idOfTheArticle': ''
};

/* Main Program */
getArticleLink(keywords)
  .then(link => {
    context.linkOfTheArticle = link;
    getArticleId(link, size)
      .then(id => {
        context.idOfTheArticle = id;
        login(loginParams)
          .then(() => {
            addToCart(context.idOfTheArticle)
              .then(() => {
              });
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      });
  })
  .catch(error => {
    console.log(error);
  });
