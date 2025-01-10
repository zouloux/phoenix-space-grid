log stream --process Phoenix | awk '/FILTER\$\$/{ print substr($0, index($0, "FILTER$$") + 9) }'
