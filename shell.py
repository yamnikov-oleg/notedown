import web
import migrations
import models
import config

models.connect(**config.DATABASE)
