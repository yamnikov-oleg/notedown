from notedown import web, migrations, models, config


models.connect(**config.DATABASE)
app = web.app
