const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 4444;

const websiteUrl = {
  javbus: "https://www.javbus.com",
  javmenu: "https://javmenu.xyz",
  javdb: "https://javdb.com"
}

app.get('/web', async (req, res) => {
  try {
    const requestData = [];

    for (const host in websiteUrl) {
      const reqUrl = websiteUrl[host];

      if (reqUrl) {
        requestData.push(axios.get(reqUrl));
      }
    }

    // 使用 Promise.all 等待所有请求完成
    const responses = await Promise.all(requestData);
    const responseData = [];

    responses.forEach((response, index) => {
      const host = Object.keys(websiteUrl)[index];
      const data = {
        host,
        title: "",
        link: ""
      };
      const $ = cheerio.load(response.data);

      switch (host) {
        case 'javbus':
          data.link = "https://www.busfan.lol";
          data.title = $('title').text();
          break;

        case 'javmenu':
          // 提取 javmenu 相关数据
          const scriptContent = $.html();
          const linkStrMatch = scriptContent.match(/var link_str = '(.*?)';/);

          if (linkStrMatch && linkStrMatch.length >= 2) {
            const linkStrValue = linkStrMatch[1];
            const links = linkStrValue.split(",");
            const rand = Math.floor(Math.random() * links.length);

            data.link = links[rand];
          }
          data.title = $('title').text();
          // 其他数据提取逻辑
          break;

        case 'javdb':
          // 提取 javdb 相关数据
          const latestDomainLink = $('nav.sub-header div.content:contains("最新域名:") a').next('a');
          const latestDomainHref = latestDomainLink.attr('href');

          data.title = $('title').text();
          data.link = latestDomainHref;
          // 其他数据提取逻辑
          break;

        default:
          // 处理未知的主机名
          data.error = 'Unknown host';
      }

      responseData.push(data);
    });

    // 发送提取的数据数组作为响应
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 启动Express服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
