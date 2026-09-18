import os
os.environ["PATH"] = r"C:\Graphviz\Graphviz-16.0.0-win64\bin" + os.pathsep + os.environ.get("PATH", "")

from diagrams import Cluster, Diagram
from diagrams.aws.compute import EC2
from diagrams.aws.ml import Sagemaker
from diagrams.onprem.analytics import Spark
from diagrams.onprem.client import Users
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.storage import Ceph
from diagrams.programming.language import Python

graph_attr = {
    "fontsize": "20",
    "bgcolor": "white",
}

with Diagram("EDGE - Evidence-Driven Game Engine - System Architecture", show=False,
             filename="EDGE_Architecture", graph_attr=graph_attr):

    users = Users("Fans / Analysts /\nFranchises")

    with Cluster("Data Sources"):
        cricsheet = EC2("Cricsheet JSON")
        cricapi = EC2("CricAPI")
        rapidapi = EC2("RapidAPI")

    with Cluster("Ingestion Layer"):
        etl = Python("Python ETL\nPipeline")
        cache = Redis("Cache")

    with Cluster("Storage Layer"):
        datalake = Ceph("Data Lake\n(Raw JSON)")
        postgres = PostgreSQL("PostgreSQL\n+ Prisma")

    with Cluster("Processing Layer"):
        processing = Spark("RAPIDS / cuDF\nProcessing")
        ai = Sagemaker("AI Engine\n(Gemini + Claude)")

    with Cluster("Serving Layer"):
        webapp = EC2("Next.js\nWeb App")
        dashboards = EC2("Live Match Centre /\nDashboards")

    cricsheet >> etl
    cricapi >> etl
    rapidapi >> etl

    etl >> cache
    etl >> datalake
    etl >> postgres

    cache >> processing
    datalake >> processing
    postgres >> ai
    processing >> ai

    ai >> webapp
    webapp >> dashboards
    users >> webapp

# Display the generated diagram
os.startfile("EDGE_Architecture.png")