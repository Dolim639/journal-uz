{
  "rewrites": [
    {
      "source": "/login",
      "destination": "/login.html"
    },
    {
      "source": "/submit",
      "destination": "/submit.html"
    },
    {
      "source": "/dashboard",
      "destination": "/dashboard.html"
    },
    {
      "source": "/profile",
      "destination": "/profile.html"
    },
    {
      "source": "/review",
      "destination": "/review.html"
    },
    {
      "source": "/admin",
      "destination": "/admin.html"
    },
    {
      "source": "/articles",
      "destination": "/articles.html"
    },
    {
      "source": "/article",
      "destination": "/article.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0, max-age=0"
        }
      ]
    }
  ]
}
